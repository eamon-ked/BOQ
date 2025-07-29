import React, { useState } from 'react';
import { Download, FileText, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const BOQExport = ({ isOpen, onClose, boqItems }) => {
  const [projectName, setProjectName] = useState('');
  const [projectNotes, setProjectNotes] = useState('');

  const totalValue = boqItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const exportToExcel = () => {
    const worksheetData = [
      ['Bill of Quantities'],
      ['Project:', projectName],
      ['Date:', new Date().toLocaleDateString()],
      [''],
      ['Item', 'Category', 'Manufacturer', 'Quantity', 'Unit', 'Unit Price', 'Total Price', 'Notes'],
      ...boqItems.map(item => [
        item.isDependency ? `  └─ ${item.name}` : item.name,
        item.category,
        item.manufacturer || 'N/A',
        item.quantity,
        item.unit,
        item.unitPrice,
        item.quantity * item.unitPrice,
        item.isDependency ? `Required by: ${item.requiredByName}` : ''
      ]),
      [''],
      ['', '', '', '', '', 'Total Value:', totalValue],
      [''],
      ['Notes:', projectNotes]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BOQ');
    
    // Style the header
    worksheet['A1'].s = { font: { bold: true, sz: 16 } };
    
    XLSX.writeFile(workbook, `${projectName || 'BOQ'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text('Bill of Quantities', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Project: ${projectName}`, 20, 35);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45);
    
    // Table
    const tableData = boqItems.map(item => [
      item.isDependency ? `  └─ ${item.name}` : item.name,
      item.category,
      item.manufacturer || 'N/A',
      item.quantity.toString(),
      item.unit,
      `$${item.unitPrice.toFixed(2)}`,
      `$${(item.quantity * item.unitPrice).toFixed(2)}`
    ]);
    
    doc.autoTable({
      head: [['Item', 'Category', 'Manufacturer', 'Qty', 'Unit', 'Unit Price', 'Total']],
      body: tableData,
      startY: 55,
      foot: [['', '', '', '', '', 'Total Value:', `$${totalValue.toFixed(2)}`]],
      footStyles: { fontStyle: 'bold' }
    });
    
    // Notes
    if (projectNotes) {
      const finalY = doc.lastAutoTable.finalY + 20;
      doc.text('Notes:', 20, finalY);
      doc.text(projectNotes, 20, finalY + 10);
    }
    
    doc.save(`${projectName || 'BOQ'}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Export BOQ</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Project Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg h-24"
              value={projectNotes}
              onChange={(e) => setProjectNotes(e.target.value)}
              placeholder="Add any additional notes or specifications"
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-2">BOQ Summary</h3>
          <div className="text-sm text-gray-600">
            <p>Total Items: {boqItems.length}</p>
            <p>Total Value: ${totalValue.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={exportToExcel}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <FileText size={20} />
            Export to Excel
          </button>
          <button
            onClick={exportToPDF}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
          >
            <Download size={20} />
            Export to PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default BOQExport;