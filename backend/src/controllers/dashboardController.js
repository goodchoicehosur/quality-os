const asyncHandler = require('../middleware/asyncHandler');
const InspectionEntry = require('../models/InspectionEntry');
const NonConformity = require('../models/NonConformity');
const ProductionLine = require('../models/ProductionLine');

const startOfDay = (d) => {
  const date = d ? new Date(d) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};
const endOfDay = (d) => {
  const date = d ? new Date(d) : new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

// @desc    Top KPI strip: line count, overall quality %, pending inspections, NC count today
// @route   GET /api/dashboard/overview
const overview = asyncHandler(async (req, res) => {
  const today = { $gte: startOfDay(), $lte: endOfDay() };

  const [lineCount, activeLineCount, todaysEntries, pendingCount, ncToday, ncCriticalToday] = await Promise.all([
    ProductionLine.countDocuments({}),
    ProductionLine.countDocuments({ active: true }),
    InspectionEntry.find({ date: today }),
    InspectionEntry.countDocuments({ status: { $in: ['Draft', 'InProgress', 'SubmittedForReview'] } }),
    NonConformity.countDocuments({ createdAt: today }),
    NonConformity.countDocuments({ createdAt: today, severity: 'Critical' }),
  ]);

  let ok = 0;
  let scored = 0;
  todaysEntries.forEach((e) => {
    e.results.forEach((row) => {
      const cell = row.shiftResults.find((s) => s.shiftCode === e.shift);
      if (cell?.value === 'OK') { ok += 1; scored += 1; }
      if (cell?.value === 'NOK') { scored += 1; }
    });
  });
  const overallQuality = scored > 0 ? Math.round((ok / scored) * 1000) / 10 : 100;

  res.json({
    success: true,
    data: {
      productionLines: lineCount,
      activeLines: activeLineCount,
      overallQualityPercent: overallQuality,
      pendingInspections: pendingCount,
      ncCountToday: ncToday,
      ncCriticalToday: ncCriticalToday,
    },
  });
});

// @desc    Per-line status cards (quality %, active shift, Auditor, chip)
// @route   GET /api/dashboard/lines
const lineStatus = asyncHandler(async (req, res) => {
  const lines = await ProductionLine.find({ active: true }).populate('defaultModel');
  const today = { $gte: startOfDay(), $lte: endOfDay() };

  const cards = await Promise.all(
    lines.map(async (line) => {
      const latest = await InspectionEntry.findOne({ productionLine: line._id, date: today })
        .sort('-createdAt')
        .populate('model Auditor');

      if (!latest) {
        return {
          line: line.name,
          lineId: line._id,
          model: line.defaultModel?.name || '—',
          status: 'Idle',
          qualityPercent: null,
          shift: null,
          Auditor: null,
        };
      }

      latest.recalculateSummary();
      return {
        line: line.name,
        lineId: line._id,
        model: latest.model?.name,
        status: latest.summary.qualityPercent < 90 && latest.summary.totalNC > 0 ? 'Alert' : 'Active',
        qualityPercent: latest.summary.qualityPercent,
        shift: latest.shift,
        Auditor: latest.Auditor?.name || '—',
        reportId: latest.reportId,
      };
    })
  );

  res.json({ success: true, data: cards });
});

// @desc    Quality trend over the last N days (default 7)
// @route   GET /api/dashboard/quality-trend?days=7
const qualityTrend = asyncHandler(async (req, res) => {
  const days = Math.min(parseInt(req.query.days, 10) || 7, 90);
  const from = startOfDay();
  from.setDate(from.getDate() - (days - 1));

  const entries = await InspectionEntry.find({ date: { $gte: from } });

  const byDay = new Map();
  entries.forEach((e) => {
    const key = new Date(e.date).toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, { ok: 0, scored: 0 });
    const bucket = byDay.get(key);
    e.results.forEach((row) => {
      const cell = row.shiftResults.find((s) => s.shiftCode === e.shift);
      if (cell?.value === 'OK') { bucket.ok += 1; bucket.scored += 1; }
      if (cell?.value === 'NOK') { bucket.scored += 1; }
    });
  });

  const series = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const bucket = byDay.get(key);
    const pct = bucket && bucket.scored > 0 ? Math.round((bucket.ok / bucket.scored) * 1000) / 10 : null;
    series.push({ date: key, qualityPercent: pct });
  }

  res.json({ success: true, data: series });
});

// @desc    Top defects (by parameter) over the last N days (default 30)
// @route   GET /api/dashboard/top-defects?days=30
const topDefects = asyncHandler(async (req, res) => {
  const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
  const from = startOfDay();
  from.setDate(from.getDate() - days);

  const agg = await NonConformity.aggregate([
    { $match: { createdAt: { $gte: from } } },
    {
      $lookup: { from: 'parameters', localField: 'parameter', foreignField: '_id', as: 'param' },
    },
    { $unwind: { path: '$param', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$param.name',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 6 },
  ]);

  const max = agg.length ? agg[0].count : 1;
  const data = agg.map((a) => ({
    label: a._id || 'Unspecified',
    count: a.count,
    percentOfMax: Math.round((a.count / max) * 100),
  }));

  res.json({ success: true, data });
});

// @desc    Inspection status distribution for a given shift (Completed / In Progress / Pending)
// @route   GET /api/dashboard/inspection-status?shift=F
const inspectionStatus = asyncHandler(async (req, res) => {
  const { shift } = req.query;
  const today = { $gte: startOfDay(), $lte: endOfDay() };
  const query = { date: today };
  if (shift) query.shift = shift;

  const [completed, inProgress, pending] = await Promise.all([
    InspectionEntry.countDocuments({ ...query, status: 'Completed' }),
    InspectionEntry.countDocuments({ ...query, status: { $in: ['InProgress', 'Draft'] } }),
    InspectionEntry.countDocuments({ ...query, status: 'SubmittedForReview' }),
  ]);

  const total = completed + inProgress + pending || 1;
  res.json({
    success: true,
    data: {
      completed, inProgress, pending,
      completedPercent: Math.round((completed / total) * 100),
      inProgressPercent: Math.round((inProgress / total) * 100),
      pendingPercent: Math.round((pending / total) * 100),
    },
  });
});

// @desc    Today's inspection log table
// @route   GET /api/dashboard/log
const todaysLog = asyncHandler(async (req, res) => {
  const today = { $gte: startOfDay(), $lte: endOfDay() };
  const entries = await InspectionEntry.find({ date: today })
    .populate('productionLine model Auditor')
    .sort('-createdAt')
    .limit(20);

  const data = entries.map((e) => {
    e.recalculateSummary();
    return {
      _id: e._id,
      reportId: e.reportId,
      line: e.productionLine?.name,
      model: e.model?.name,
      shift: e.shift,
      Auditor: e.Auditor?.name || '—',
      time: new Date(e.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      qualityPercent: e.summary.qualityPercent,
      ncCount: e.summary.totalNC,
      status: e.status,
    };
  });

  res.json({ success: true, data });
});

// @desc    Recent non-conformities widget
// @route   GET /api/dashboard/recent-nc
const recentNC = asyncHandler(async (req, res) => {
  const items = await NonConformity.find({})
    .populate('productionLine model operation parameter')
    .sort('-createdAt')
    .limit(6);

  res.json({
    success: true,
    data: items.map((i) => ({
      ncId: i.ncId,
      line: i.productionLine?.name,
      model: i.model?.name,
      operation: i.operation ? `OP-${i.operation.opNumber} ${i.operation.processName}` : '',
      parameter: i.parameter?.name,
      actualValue: i.actualValue,
      status: i.status,
    })),
  });
});

module.exports = { overview, lineStatus, qualityTrend, topDefects, inspectionStatus, todaysLog, recentNC };
