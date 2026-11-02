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
import ShopSettings from './pages/ShopSettings'; // <-- C'est ici que l'erreur se trouvait
import ProtectedRoute from './components/layout/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Routes protégées */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/ai-ads" element={<AdGenerator />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/settings" element={<ShopSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;