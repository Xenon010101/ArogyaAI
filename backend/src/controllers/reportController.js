const Report = require('../../models/Report');
const ApiError = require('../../utils/ApiError');

exports.getAllReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.user.role !== 'admin') {
      filter.user = req.user.id;
    }

    if (req.query.reportType) {
      filter.reportType = req.query.reportType;
    }

    if (req.query.startDate && req.query.endDate) {
      filter.reportDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    } else if (req.query.startDate) {
      filter.reportDate = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      filter.reportDate = { $lte: new Date(req.query.endDate) };
    }

    if (req.query.isPrivate) {
      filter.isPrivate = req.query.isPrivate === 'true';
    }

    const total = await Report.countDocuments(filter);

    const reports = await Report.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      status: 'success',
      results: reports.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: {
        reports,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('user', 'name email phone');

    if (!report) {
      throw new ApiError(404, 'Report not found');
    }

    if (report.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      if (report.isPrivate) {
        throw new ApiError(403, 'You do not have permission to view this report');
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        report,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createReport = async (req, res, next) => {
  try {
    const reportData = {
      ...req.body,
      user: req.user.id,
    };

    const report = await Report.create(reportData);

    res.status(201).json({
      status: 'success',
      data: {
        report,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateReport = async (req, res, next) => {
  try {
    let report = await Report.findById(req.params.id);

    if (!report) {
      throw new ApiError(404, 'Report not found');
    }

    if (report.user.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'You do not have permission to update this report');
    }

    const allowedFields = [
      'title', 'reportType', 'description', 'fileUrl', 'fileName',
      'fileType', 'fileSize', 'reportDate', 'labName', 'doctorName',
      'hospitalName', 'findings', 'conclusion', 'isPrivate', 'tags'
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    report = await Report.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        report,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      throw new ApiError(404, 'Report not found');
    }

    if (report.user.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'You do not have permission to delete this report');
    }

    await Report.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = { user: req.user.id };

    if (req.query.reportType) {
      filter.reportType = req.query.reportType;
    }

    const total = await Report.countDocuments(filter);

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      status: 'success',
      results: reports.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: {
        reports,
      },
    });
  } catch (error) {
    next(error);
  }
};
