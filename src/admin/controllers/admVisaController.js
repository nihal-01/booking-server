const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { Country, VisaType, Visa, VisaApplication } = require("../../models");
const { visaSchema, visaTypeSchema } = require("../validations/visa.schema");

module.exports = {
  createNewVisa: async (req, res) => {
    try {
      const {
        country,
        name,
        documents,
        inclusions,
        description,
        faqs,
        details,
      } = req.body;



      const { _, error } = visaSchema.validate({
        ...req.body,
        inclusions: inclusions ? JSON.parse(inclusions) : [],
        faqs: faqs ? JSON.parse(faqs) : [],
        details: details ? JSON.parse(details) : [],
      });

      if (error) {
        return sendErrorResponse(res, 400, error.details[0].message);
      }

      if (!isValidObjectId(country)) {
        return sendErrorResponse(res, 400, "Invalid country id");
      }

      const countryDetails = await Country.findOne({
        _id: country,
        isDeleted: false,
      });
      if (!countryDetails) {
        return sendErrorResponse(res, 400, "Country not found");
      }

      if (!req.file?.path) {
        return sendErrorResponse(res, 400, "Sample visa is required");
      }

      let sampleVisa;
      if (req.file?.path) {
        sampleVisa = "/" + req.file.path.replace(/\\/g, "/");
      }

      let parsedInclusion;
      if (inclusions) {
        parsedInclusion = JSON.parse(inclusions);
      }

      let parsedFaqs;
      if (faqs) {
        parsedFaqs = JSON.parse(faqs);
      }

      let parsedDetails;
      if (details) {
        parsedDetails = JSON.parse(details);
      }

      const newVisa = new Visa({
        country,
        name,
        // documents,
        inclusions: parsedInclusion,
        description,
        faqs: parsedFaqs,
        details: parsedDetails,
        // keywords,
        sampleVisa,
      });
      await newVisa.save();

      res.status(200).json(newVisa);
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  addNewVisaType: async (req, res) => {
    try {
      const {
        visa,
        visaName,
        processingTimeFormat,
        processingTime,
        stayPeriodFormat,
        stayPeriod,
        validityTimeFormat,
        validity,
        entryType,
        serviceCharge,
        ageFrom,
        ageTo,
        visaPrice,
        tax,
        purchaseCost,
      } = req.body;

      const { _, error } = visaTypeSchema.validate(req.body);
      if (error) {
        return sendErrorResponse(res, 400, error.details[0].message);
      }

      if (!isValidObjectId(visa)) {
        return sendErrorResponse(res, 400, "Invalid country visa id");
      }

      const visaDetails = await Visa.findById(visa);
      if (!visaDetails) {
        return sendErrorResponse(res, 404, "Country Visa not found");
      }

      const newVisaType = new VisaType({
        visa,
        visaName,
        processingTimeFormat,
        processingTime,
        stayPeriodFormat,
        stayPeriod,
        validityTimeFormat,
        validity,
        entryType,
        serviceCharge,
        ageFrom,
        ageTo,
        visaPrice,
        tax,
        purchaseCost,
      });
      await newVisaType.save();

      res.status(200).json(newVisaType);
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  listAllVisa: async (req, res) => {
    try {
      const { search } = req.query;

      const filter = { isDeleted: false };

      if (search && search !== "") {
        filter.name = { $regex: search, $options: "i" };
      }


      const visaList = await Visa.find(filter).populate("country");

      if (!visaList) {
        sendErrorResponse(res, 400, "Visa not found");
      }

      res.status(200).json(visaList);
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  listAllVisaType: async (req, res) => {
    try {
      const { skip = 0, limit = 10,  searchInput} = req.query;

      const filter = { isDeleted: false };

      if (searchInput && searchInput !== "") {
        filter.visaName = { $regex: searchInput, $options: "i" };
      }


      const visaTypeList = await VisaType.find(filter).populate({
        path: "visa",
        populate: { path: "country" },
      }).sort({
        createdAt: -1,
    })
    .limit(limit)
    .skip(limit * skip);

      if (!visaTypeList) {
        sendErrorResponse(res, 400, "visaType not found");
      }
      const totalVisaTypeList = await VisaType.find(filter).count();

      res
        .status(200)
        .json({
          skip: Number(skip),
          limit: Number(limit),
          visaTypeList,
          totalVisaTypeList,
        });

    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  getSingleVisa: async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return sendErrorResponse(res, 400, "Invalid Visa id");
      }

      const visa = await Visa.findOne({ _id: id, isDeleted: false });

      if (!visa) {
        sendErrorResponse(res, 400, "Visa not found");
      }

      res.status(200).json(visa);
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  getSingleVisaType: async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return sendErrorResponse(res, 400, "Invalid VisaType id");
      }

      const visaType = await VisaType.findOne({ _id: id, isDeleted: false });

      if (!visaType) {
        sendErrorResponse(res, 400, "visaType not found");
      }

      res.status(200).json(visaType);
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  updateVisa: async (req, res) => {
    try {
      const { id } = req.params;

      const {
        country,
        name,
        documents,
        inclusions,
        description,
        faqs,
        details,
        keywords,
      } = req.body;


      // const { _, error } = visaSchema.validate( {...req.body ,
      //     inclusions: inclusions ? JSON.parse(inclusions) : [],
      //     faqs: faqs ? JSON.parse(faqs) : [],
      //     details: details ? JSON.parse(details) : []});

      // if (error) {
      //     return sendErrorResponse(res, 400, error.details[0].message);
      // }

      if (!isValidObjectId(country)) {
        return sendErrorResponse(res, 400, "Invalid country id");
      }

      const countryDetails = await Country.findOne({
        _id: country,
        isDeleted: false,
      });
      if (!countryDetails) {
        return sendErrorResponse(res, 400, "Country not found");
      }

      let sampleVisa;
      if (req.file?.path) {
        sampleVisa = "/" + req.file.path.replace(/\\/g, "/");
      }

      let parsedInclusion;
      if (inclusions) {
        parsedInclusion = JSON.parse(inclusions);
      }

      let parsedFaqs;
      if (faqs) {
        parsedFaqs = JSON.parse(faqs);
      }

      let parsedDetails;
      if (details) {
        parsedDetails = JSON.parse(details);
      }
      const updatedVisa = await Visa.findByIdAndUpdate(
        id,
        {
          country,
          name,
          // documents,
          inclusions: parsedInclusion,
          description,
          faqs: parsedFaqs,
          details: parsedDetails,
          // keywords,
          sampleVisa,
        },
        { runValidators: true, new: true }
      );

      res.status(200).json(updatedVisa);
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  updateVisaType: async (req, res) => {
    try {
      const { id } = req.params;

      const {
        visa,
        visaName,
        processingTimeFormat,
        processingTime,
        stayPeriodFormat,
        stayPeriod,
        validityTimeFormat,
        validity,
        entryType,
        serviceCharge,
        ageFrom,
        ageTo,
        visaPrice,
        tax,
        purchaseCost,
      } = req.body;

      const { _, error } = visaTypeSchema.validate(req.body);
      if (error) {
        return sendErrorResponse(res, 400, error.details[0].message);
      }

      if (!isValidObjectId(id)) {
        return sendErrorResponse(res, 400, "Invalid VisaType id");
      }

      if (!isValidObjectId(visa)) {
        return sendErrorResponse(res, 400, "Invalid country visa id");
      }

      const visaDetails = await Visa.findById(visa);
      if (!visaDetails) {
        return sendErrorResponse(res, 404, "Country Visa not found");
      }

      const updatedVisaType = await VisaType.findByIdAndUpdate(
        id,
        {
          visa,
          visaName,
          processingTimeFormat,
          processingTime,
          stayPeriodFormat,
          stayPeriod,
          validityTimeFormat,
          validity,
          entryType,
          serviceCharge,
          ageFrom,
          ageTo,
          visaPrice,
          tax,
          purchaseCost,
        },
        { runValidators: true, new: true }
      );

      res.status(200).json(updatedVisaType);
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  deleteVisaType: async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return sendErrorResponse(res, 400, "Invalid VisaType id");
      }

      const visaType = await VisaType.findByIdAndUpdate(id, {
        isDeleted: true,
      });

      if (!visaType) {
        return sendErrorResponse(res, 400, "VisaType not found");
      }

      res.status(200).json({
        message: "visaType successfully deleted",
        _id: id,
      });
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  deleteVisa: async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return sendErrorResponse(res, 400, "Invalid Visa id");
      }

      const visa = await Visa.findByIdAndUpdate(id, {
        isDeleted: true,
      });

      if (!visa) {
        return sendErrorResponse(res, 400, "Visa not found");
      }

      res.status(200).json({
        message: "visa successfully deleted",
        _id: id,
      });
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

 
};
