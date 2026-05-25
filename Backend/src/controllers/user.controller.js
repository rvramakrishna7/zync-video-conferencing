import User from "../models/User.model.js";

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;

    // findByIdAndUpdate with { new: true } returns the updated document (not the old one)
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar },
      { new: true, runValidators: true } // runValidators re-runs schema validation on update
    );

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
