const cloudinary = require("../config/cloudinary"); // Make sure this path is correct
const fs = require("fs");

const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
      folder: "hrms/cv",
    });
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary Error:", error.message);
    throw new Error(error.message);
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Always clean up the /uploads folder
    }
  }
};

module.exports = { uploadToCloudinary };