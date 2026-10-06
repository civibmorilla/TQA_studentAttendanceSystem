exports.maskSensitiveData = (req, res, next) => {
  // Intercept the default res.json to apply masking
  const originalJson = res.json;
  
  res.json = function (body) {
    // Only mask if the data exists and the client hasn't explicitly requested to unmask it
    if (body && body.data && req.query.unmask !== 'true') {
      
      // Mask contact number (e.g., 0917-123-4567 becomes ••••••••4567)
      if (body.data.contactNo) {
        body.data.contactNo = body.data.contactNo.replace(/.(?=.{4})/g, '•');
      }
      
      // Mask address (e.g., 123 Rizal St, Bataan becomes ••••••••, Bataan)
      if (body.data.address) {
        const addressParts = body.data.address.split(',');
        if (addressParts.length > 1) {
          addressParts[0] = '••••••••';
          body.data.address = addressParts.join(',');
        } else {
          body.data.address = '••••••••';
        }
      }
    }
    
    // Call the original res.json with the masked body
    originalJson.call(this, body);
  };
  
  next();
};