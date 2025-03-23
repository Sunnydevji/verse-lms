const excel = require('exceljs');

// Generate Excel file from data
const generateExcel = async (data, sheetConfigs) => {
  // Create a new Excel workbook
  const workbook = new excel.Workbook();
  
  // Process each sheet configuration
  for (const config of sheetConfigs) {
    const sheet = workbook.addWorksheet(config.name);
    sheet.columns = config.columns;
    
    // Add data rows
    if (config.data && config.data.length > 0) {
      sheet.addRows(config.data);
    }
    
    // Style the header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6E6' }
    };
  }
  
  return workbook;
};

module.exports = { generateExcel };