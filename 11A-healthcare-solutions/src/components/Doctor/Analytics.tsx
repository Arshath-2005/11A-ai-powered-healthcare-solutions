import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Download, FileDown } from 'lucide-react';

interface DoctorRevenue {
  name: string;
  revenue: number;
  specialization: string;
}

const SPECIALIZATION_LIST = [
  'Anesthesiology', 'Cardiology', 'Dermatology', 'Emergency Medicine', 'Endocrinology', 'ENT',
  'Family Medicine', 'Gastroenterology', 'General Medicine', 'General Surgery', 'Gynecology',
  'Infectious Disease', 'Nephrology', 'Neurology', 'Oncology', 'Ophthalmology', 'Orthopedics',
  'Pathology', 'Pediatrics', 'Physical Medicine', 'Plastic Surgery', 'Psychiatry', 'Pulmonology',
  'Radiology', 'Rheumatology', 'Urology'
];

const COLORS = ['#00B8D9', '#36B37E', '#FFAB00', '#FF5630', '#6554C0'];

const Analytics: React.FC = () => {
  const [data, setData] = useState<DoctorRevenue[]>([]);
  const [filteredData, setFilteredData] = useState<DoctorRevenue[]>([]);
  const [specializationFilter, setSpecializationFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, 'medicalReports'));
      const rawData: DoctorRevenue[] = [];

      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const doctorName = d.doctorName || 'Unknown';
        const specialization = d.specialization || 'General Medicine';
        const fee = d.consultationFee || 500;

        rawData.push({
          name: doctorName,
          revenue: fee,
          specialization,
        });
      });

      const grouped: Record<string, DoctorRevenue> = {};

      for (const d of rawData) {
        if (grouped[d.name]) {
          grouped[d.name].revenue += d.revenue;
        } else {
          grouped[d.name] = { ...d };
        }
      }

      const result = Object.values(grouped);
      setData(result);
      setFilteredData(result);
    };

    fetchData();
  }, []);

  // Filter by specialization
  useEffect(() => {
    let filtered = [...data];
    if (specializationFilter) {
      filtered = filtered.filter(d => d.specialization === specializationFilter);
    }
    setFilteredData(filtered);
  }, [specializationFilter, data]);

  const top5Doctors = [...filteredData]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const handleExportPDF = () => {
    const input = document.getElementById('report-section');
    if (!input) return;

    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = (pdf as any).getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('analytics-report.pdf');
    });
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Analytics');
    XLSX.writeFile(workbook, 'analytics-report.xlsx');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Doctor Analytics</h1>
        <div className="flex gap-3">
          <button onClick={handleExportPDF} className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-600">
            <FileDown className="w-4 h-4" /> Export PDF
          </button>
          <button onClick={handleExportExcel} className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-600">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={specializationFilter}
          onChange={(e) => setSpecializationFilter(e.target.value)}
          className="border px-4 py-2 rounded-lg"
        >
          <option value="">All Specializations</option>
          {SPECIALIZATION_LIST.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div id="report-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold mb-4">Doctor-wise Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={filteredData}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {filteredData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold mb-4">Top 5 Earning Doctors</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top5Doctors}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#00B8D9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold mb-4">Doctor Revenue Details</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm text-left">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-2 border">Doctor</th>
                <th className="px-4 py-2 border">Specialization</th>
                <th className="px-4 py-2 border">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((doc, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{doc.name}</td>
                  <td className="px-4 py-2 border">{doc.specialization}</td>
                  <td className="px-4 py-2 border">₹ {doc.revenue}</td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-4 text-gray-500">No data found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
