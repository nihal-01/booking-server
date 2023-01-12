const { hash, compare } = require("bcryptjs");

const { sendErrorResponse } = require("../../helpers");
const { Admin } = require("../models");
const {
    adminAddSchema,
    adminLoginSchema,
    adminPasswordUpdateSchema,
} = require("../validations/adminAuth.schema");
const { isValidObjectId } = require("mongoose");

module.exports = {
    addNewAdmin: async (req, res) => {
        try {
            const { name, email, password } = req.body;

            const { _, error } = adminAddSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(
                    res,
                    400,
                    error.details ? error.details[0].message : error.message
                );
            }

            let avatarImg;
            if (req.file?.path) {
                avatarImg = "/" + req.file.path.replace(/\\/g, "/");
            }

            const admin = await Admin.findOne({ email });
            if (admin) {
                return sendErrorResponse(res, 400, "Email already exists");
            }

            const hashedPassowrd = await hash(password, 8);

            const newAdmin = new Admin({
                name,
                email,
                password: hashedPassowrd,
                role: "admin",
            });
            await newAdmin.save();

            res.status(200).json(newAdmin);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    adminLogin: async (req, res) => {
        try {
            const { email, password } = req.body;

            const { _, error } = adminLoginSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const admin = await Admin.findOne({ email });
            if (!admin) {
                return sendErrorResponse(
                    res,
                    500,
                    "Account not found. Invalid credentials"
                );
            }

            const isMatch = await compare(password, admin.password);
            if (!isMatch) {
                return sendErrorResponse(
                    res,
                    500,
                    "Account not found. Invalid credentials"
                );
            }

            const jwtToken = await admin.generateAuthToken();
            admin.lastLoggedIn = new Date();
            await admin.save();

            res.status(200).json({ admin, jwtToken });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllAdmins: async (req, res) => {
        try {
            const { skip = 0, limit = 10 } = req.query;

            const admins = await Admin.find({ role: "admin" })
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(limit * skip);

            const totalAdmins = await Admin.find({}).count();

            res.status(200).json({ admins, totalAdmins, skip, limit });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteAdmin: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid admin id");
            }

            const admin = await Admin.findByIdAndDelete(id);
            if (!admin) {
                return sendErrorResponse(res, 404, "Admin not found");
            }

            res.status(200).json({
                message: "Admin deleted successfully",
                _id: id,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAdmin: async (req, res) => {
        try {
            res.status(200).json(req.admin);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateAdminDetails: async (req, res) => {
        try {
            const {
                email,
                name,
                phoneNumber,
                designation,
                joinedDate,
                city,
                country,
                description,
            } = req.body;

            let avatarImg;
            if (req.file?.path) {
                avatarImg = "/" + req.file.path.replace(/\\/g, "/");
            }

            const admin = await Admin.findOneAndUpdate(
                { _id: req.admin?._id },
                {
                    email,
                    name,
                    phoneNumber,
                    designation,
                    joinedDate,
                    city,
                    country,
                    description,
                    avatar: avatarImg,
                },
                { runValidators: true, new: true }
            );

            if (!admin) {
                return sendErrorResponse(res, 404, "Admin not found");
            }

            res.status(200).json(admin);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateAdminPassword: async (req, res) => {
        try {
            const { oldPassword, newPassword } = req.body;

            const { _, error } = adminPasswordUpdateSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(
                    res,
                    400,
                    error.details ? error?.details[0]?.message : error.message
                );
            }

            const isMatch = await compare(oldPassword, req.admin.password);
            if (!isMatch) {
                return sendErrorResponse(res, 400, "Old password is incorrect");
            }

            const hashedPassowrd = await hash(newPassword, 8);
            const admin = await Admin.findOneAndUpdate(
                { _id: req.admin._id },
                { password: hashedPassowrd }
            );

            if (!admin) {
                return sendErrorResponse(res, 404, "User not found");
            }

            res.status(200).json({ message: "Password updated successfully" });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
