exports.healthCheck = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'ArogyaAI API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    next(error);
  }
};
