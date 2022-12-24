const { Schema, model } = require("mongoose");
const jwt = require("jsonwebtoken");

const adminSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            lowercase: true,
            unique: true,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            requied: true,
            lowercase: true,
            enum: ["admin", "super-admin"],
        },
        lastLoggedIn: {
            type: Date,
        },
        jwtToken: {
            type: String,
        },
    },
    { timestamps: true }
);

adminSchema.methods.toJSON = function () {
    const admin = this;
    const adminObj = admin.toObject();

    delete adminObj.password;
    delete adminObj.jwtToken;

    return adminObj;
};

adminSchema.methods.generateAuthToken = async function () {
    try {
        const admin = this;
        const jwtToken = jwt.sign(
            { _id: admin._id.toString(), email: admin?.email?.toString() },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        admin.jwtToken = jwtToken;
        return jwtToken;
    } catch (err) {
        throw new Error(err);
    }
};

const Admin = model("Admin", adminSchema);

module.exports = Admin;
