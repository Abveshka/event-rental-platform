import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EquipmentPage } from "./pages/EquipmentPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { MyListingsPage } from "./pages/MyListingsPage";
import { NewEquipmentPage } from "./pages/NewEquipmentPage";
import { IncomingBookingsPage } from "./pages/IncomingBookingsPage";
import { SupplierProfilePage } from "./pages/SupplierProfilePage";
import { PaymentPage } from "./pages/PaymentPage";
import { EditEquipmentPage } from "./pages/EditEquipmentPage";
import { SuppliersPage } from "./pages/SuppliersPage";
import { BookingDetailPage } from "./pages/BookingDetailPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EquipmentPage />} />
        <Route path="/equipment/:idSlug" element={<EquipmentPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my-listings" element={<MyListingsPage />} />
        <Route path="/my-listings/new" element={<NewEquipmentPage />} />
        <Route path="/incoming-bookings" element={<IncomingBookingsPage />} />
        <Route path="/suppliers/:id" element={<SupplierProfilePage />} />
        <Route path="/bookings/:id/pay" element={<PaymentPage />} />
        <Route path="/my-listings/:id/edit" element={<EditEquipmentPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/bookings/:id" element={<BookingDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;