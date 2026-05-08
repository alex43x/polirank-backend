export const ApiResponse = {
  success(res, data, meta) {
    return res.status(200).json({ data, ...(meta && { meta }) });
  },
};
