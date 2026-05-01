import { Routes, Route, Navigate } from 'react-router-dom';

/* --- Placeholder pages (replaced in Sprint 1.2+) --- */
const SetupWizard = () => <div className="p-8 text-center text-xl">Setup Wizard (coming soon)</div>;
const Login = () => <div className="p-8 text-center text-xl">Login (coming soon)</div>;
const Dashboard = () => <div className="p-8 text-center text-xl">Dashboard (coming soon)</div>;
const Calendar = () => <div className="p-8 text-center text-xl">Calendar (coming soon)</div>;
const Tasks = () => <div className="p-8 text-center text-xl">Tasks (coming soon)</div>;
const Lists = () => <div className="p-8 text-center text-xl">Lists (coming soon)</div>;
const Photos = () => <div className="p-8 text-center text-xl">Photos (coming soon)</div>;
const Wall = () => <div className="p-8 text-center text-xl">Wall Display (coming soon)</div>;

export default function App() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupWizard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/lists" element={<Lists />} />
      <Route path="/photos" element={<Photos />} />
      <Route path="/wall" element={<Wall />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
