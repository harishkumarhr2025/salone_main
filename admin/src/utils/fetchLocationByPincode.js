// export const fetchLocationByPincode = async ({ pincode, setFormData, setLoading, setErrors }) => {
//   setLoading(true);
//   try {
//     const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
//     const data = await response.json();
//     if (data[0].Status === 'Success') {
//       const postOffice = data[0].PostOffice[0];
//       setFormData((prev) => ({
//         ...prev,
//         address: {
//           ...prev.address,
//           city: postOffice.District,
//           state: postOffice.State,
//           country: 'India',
//           zip: pincode,
//         },
//       }));
//       setErrors(''); // Clear any previous error
//     } else {
//       // Invalid pincode - clear fields or keep zip but clear others
//       setFormData((prev) => ({
//         ...prev,
//         address: {
//           ...prev.address,
//           city: '',
//           state: '',
//           country: '',
//           zip: pincode,
//         },
//       }));
//       setErrors('Invalid pincode, please enter a correct one.');
//     }
//   } catch (err) {
//     console.error('Pincode fetch error:', err);
//     setErrors('Error fetching pincode data, please try again later.');
//   } finally {
//     setLoading(false);
//   }
// };

// Initialize errors as an object in state

// Update your fetchLocationByPincode function to use error keys
// export const fetchLocationByPincode = async ({ pincode, setFormData, setLoading, setErrors }) => {
//   setLoading(true);
//   try {
//     const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
//     const data = await response.json();

//     setErrors((prev) => ({ ...prev, 'address.zip': '' }));

//     if (data[0].Status === 'Success') {
//       const postOffice = data[0].PostOffice[0];
//       setFormData((prev) => ({
//         ...prev,
//         address: {
//           ...prev.address,
//           city: postOffice.District,
//           state: postOffice.State,
//           country: 'India',
//           zip: pincode,
//         },
//       }));
//     } else {
//       setErrors((prev) => ({
//         ...prev,
//         'address.zip': 'Invalid pincode, please enter a correct one.',
//       }));
//     }
//   } catch (err) {
//     setErrors((prev) => ({
//       ...prev,
//       'address.zip': 'Error fetching pincode data, please try again later.',
//     }));
//   } finally {
//     setLoading(false);
//   }
// };

export const fetchLocationByPincode = async ({ pincode, setFormData, setLoading, setErrors }) => {
  setLoading(true);
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await response.json();

    setErrors((prev) => ({ ...prev, 'address.zip': '' }));

    if (data[0].Status === 'Success') {
      const postOffice = data[0].PostOffice[0];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          city: postOffice.District,
          state: postOffice.State,
          country: 'India',
          zip: pincode,
        },
      }));
    } else {
      // Clear auto-filled fields on invalid pincode
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          city: '',
          state: '',
          country: '',
          zip: pincode, // Keep entered pincode
        },
      }));
      setErrors((prev) => ({
        ...prev,
        'address.zip': 'Invalid pincode, please enter a correct one.',
      }));
    }
  } catch (err) {
    setErrors((prev) => ({
      ...prev,
      'address.zip': 'Error fetching pincode data, please try again later.',
    }));
  } finally {
    setLoading(false);
  }
};
