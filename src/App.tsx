import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Transactions from './pages/Transactions';
import Purchases from './pages/Purchases';
import AdGenerator from './pages/AdGenerator';
import Subscription from './pages/Subscription';
import ShopSettings from './pages/ShopSettings';
import Security from './pages/Security';
import Shops from './pages/Shops';
import Reports from './pages/Reports';
import AIAssistant from './pages/AIAssistant';
import MfaVerify from './pages/MfaVerify';
import ProtectedRoute from './components/layout/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/mfa-verify" element={<MfaVerify />} />

        {/* Routes protégées (nécessitent d'être connecté) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/ai-ads" element={<AdGenerator />} />
          <Route path="/assistant" element={<AIAssistant />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/settings" element={<ShopSettings />} />
          <Route path="/security" element={<Security />} />
          <Route path="/shops" element={<Shops />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;