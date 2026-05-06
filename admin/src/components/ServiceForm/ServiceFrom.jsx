import React, { useEffect, useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Grid,
  Typography,
  IconButton,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

const initialServiceStructure = {
  category: '',
  types: [],
  services: [{ name: '', prices: {} }],
};

const ServiceForm = ({ onSubmit, initialData }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [categories, setCategories] = useState(
    initialData ? [...initialData] : [{ ...initialServiceStructure }],
  );

  useEffect(() => {
    // Handle both creation and edit modes
    if (initialData && initialData.length) {
      // Transform prices if coming from API
      const transformedData = initialData.map((category) => ({
        ...category,
        services: category.services.map((service) => ({
          ...service,
          prices: category.types.reduce(
            (acc, type) => ({
              ...acc,
              [type]: service.prices[type] || '',
            }),
            {},
          ),
        })),
      }));
      setCategories(transformedData);
    } else {
      setCategories([{ ...initialServiceStructure }]);
    }
  }, [initialData]);

  const handleCategoryChange = (index, field, value) => {
    const updatedCategories = [...categories];
    updatedCategories[index][field] = value;

    if (field === 'types') {
      updatedCategories[index].services.forEach((service) => {
        service.prices = value.reduce((acc, type) => ({ ...acc, [type]: '' }), {});
      });
    }
    setCategories(updatedCategories);
  };

  const handleServiceChange = (catIndex, serviceIndex, field, value) => {
    const updatedCategories = [...categories];
    updatedCategories[catIndex].services[serviceIndex][field] = value;
    setCategories(updatedCategories);
  };

  const addCategory = () => {
    setCategories([...categories, { ...initialServiceStructure }]);
  };

  const addService = (catIndex) => {
    const updatedCategories = [...categories];
    const newService = {
      name: '',
      prices: updatedCategories[catIndex].types.reduce((acc, type) => ({ ...acc, [type]: '' }), {}),
    };
    updatedCategories[catIndex].services.push(newService);
    setCategories(updatedCategories);
  };

  const removeCategory = (catIndex) => {
    const updatedCategories = categories.filter((_, i) => i !== catIndex);
    setCategories(updatedCategories);
  };

  const removeService = (catIndex, serviceIndex) => {
    const updatedCategories = [...categories];
    updatedCategories[catIndex].services = updatedCategories[catIndex].services.filter(
      (_, i) => i !== serviceIndex,
    );
    setCategories(updatedCategories);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(categories);
  };

  return (
    <Paper elevation={3} sx={{ padding: 3, margin: 2 }}>
      <Typography variant="h6" gutterBottom mb={2}>
        {initialData ? 'Edit Service Category' : 'Add New Service Category'}
      </Typography>

      <form onSubmit={handleSubmit}>
        {categories.map((category, catIndex) => (
          <div key={catIndex}>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  label="Category Name"
                  value={category.category}
                  onChange={(e) => handleCategoryChange(catIndex, 'category', e.target.value)}
                  required
                  size={isMobile ? 'small' : 'medium'}
                />
              </Grid>

              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  label="Types (comma separated)"
                  value={category.types.join(',')}
                  onChange={(e) =>
                    handleCategoryChange(catIndex, 'types', e.target.value.split(','))
                  }
                  placeholder="e.g., Normal,Rica,Brazilian"
                  size={isMobile ? 'small' : 'medium'}
                />
              </Grid>

              <Grid item xs={2}>
                <IconButton
                  onClick={() => removeCategory(catIndex)}
                  sx={{ borderRadius: '50%', border: '2px solid red' }}
                >
                  <RemoveIcon color="error" />
                </IconButton>
              </Grid>
            </Grid>

            {category.services.map((service, serviceIndex) => (
              <Grid container spacing={2} key={serviceIndex} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    label="Service Name"
                    value={service.name}
                    onChange={(e) =>
                      handleServiceChange(catIndex, serviceIndex, 'name', e.target.value)
                    }
                    required
                    size={isMobile ? 'small' : 'medium'}
                  />
                </Grid>

                {category.types.map((type, typeIndex) => (
                  <Grid item xs={6} sm={2} key={typeIndex}>
                    <TextField
                      fullWidth
                      label={`${type} Price`}
                      type="number"
                      value={service.prices[type] || ''}
                      onChange={(e) => {
                        const updatedPrices = { ...service.prices, [type]: e.target.value };
                        handleServiceChange(catIndex, serviceIndex, 'prices', updatedPrices);
                      }}
                      required
                      size={isMobile ? 'small' : 'medium'}
                      InputProps={{
                        startAdornment: <span style={{ marginRight: 4 }}>₹</span>,
                      }}
                    />
                  </Grid>
                ))}

                <Grid item xs={6} sm={2}>
                  <IconButton
                    onClick={() => removeService(catIndex, serviceIndex)}
                    disabled={category.services.length === 1}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ borderRadius: '50%', border: '2px solid red' }}
                  >
                    <RemoveIcon color="error" />
                  </IconButton>
                </Grid>
              </Grid>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => addService(catIndex)}
              sx={{ mb: 3 }}
            >
              Add Service
            </Button>
            <Divider sx={{ mb: 3 }} />
          </div>
        ))}

        <Grid container spacing={2}>
          {/* <Grid item xs={12} sm="auto">
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={addCategory}
              fullWidth={isMobile}
              size={isMobile ? 'small' : 'medium'}
            >
              Add Category
            </Button> */}
          {/* </Grid> */}
          <Grid item xs={12} sm="auto">
            <Button
              type="submit"
              variant="contained"
              color="success"
              fullWidth={isMobile}
              size={isMobile ? 'small' : 'medium'}
            >
              Save services
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default ServiceForm;
