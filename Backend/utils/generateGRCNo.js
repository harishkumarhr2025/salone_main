import Guest from "../models/GuestModel.js";
import moment from "moment";

const generateGRCNo = async (session) => {
  const currentYear = moment().format("YYYY");
  const previousYear = moment().subtract(1, "year").format("YYYY");

  // Financial Year Calculation (consistent format without spaces)
  const financialYear =
    moment().month() < 3 // months are 0-indexed (0-11)
      ? `${previousYear}-${currentYear}`
      : `${currentYear}-${parseInt(currentYear) + 1}`;

  // Find the last GRC number using numeric sorting
  const [lastGuest] = await Guest.aggregate([
    { $match: { financialYear } },
    {
      $project: {
        numericGRC: {
          $convert: { input: "$GRC_No", to: "int", onError: 0 }, // Safer conversion
        },
      },
    },
    { $sort: { numericGRC: -1 } },
    { $limit: 1 },
  ]).session(session);

  const newGRCNumber = lastGuest?.numericGRC ? lastGuest.numericGRC + 1 : 1;

  return {
    GRC_No: newGRCNumber.toString().padStart(3, "0"),
    financialYear,
  };
};

export { generateGRCNo };
