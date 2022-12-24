const { hash, compare } = require("bcryptjs");

const { sendErrorResponse } = require("../../helpers");
const { Admin } = require("../models");
const {
    adminAddSchema,
    adminLoginSchema,
} = require("../validations/adminAuth.schema");
const { isValidObjectId } = require("mongoose");

module.exports = {
    addNewAdmin: async (req, res) => {
        try {
            const { name, email, password } = req.body;
            const { _, error } = adminAddSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
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
            const admins = await Admin.find({ role: "admin" }).sort({
                createdAt: -1,
            });
            res.status(200).json(admins);
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
};
