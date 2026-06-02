export default function ApprovalTable() {
  const requests = [
    { id: '#RMS-9421', pos: 'Senior Developer', dept: 'IT' },
    { id: '#RMS-9419', pos: 'Marketing Lead', dept: 'Marketing' },
    { id: '#RMS-9418', pos: 'UX Designer', dept: 'Design' },
  ];

  return (
    <table className="w-full text-sm">
      <thead className="text-slate-500 border-b border-[#D6CEC4]">
        <tr>
          <th className="py-3 text-left">Request ID</th>
          <th className="py-3 text-left">Position</th>
          <th className="py-3 text-left">Department</th> {/* Đã thêm cột này */}
          <th className="py-3 text-right">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#D6CEC4]/40">
        {requests.map((req) => (
          <tr key={req.id} className="hover:bg-slate-50 transition-colors">
            <td className="py-4 font-mono text-teal-600">{req.id}</td>
            <td className="py-4 font-medium">{req.pos}</td>
            <td className="py-4 text-slate-600">{req.dept}</td> {/* Hiển thị dept */}
            <td className="py-4 text-right text-teal-600 font-bold hover:underline cursor-pointer">
              Review
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}