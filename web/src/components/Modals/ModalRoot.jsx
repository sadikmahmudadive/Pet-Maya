import React from 'react';
import { useApp } from '../../context/AppContext';
import AuthModal from './AuthModal';
import AddPetModal from './AddPetModal';
import BookingModal from './BookingModal';
import TeleConsultModal from './TeleConsultModal';
import CartDrawer from './CartDrawer';
import CheckoutModal from './CheckoutModal';
import OrderTrackerModal from './OrderTrackerModal';
import ReviewModal from './ReviewModal';
import AddRecordModal from './AddRecordModal';
import EditPriceModal from './EditPriceModal';
import EditProfileModal from './EditProfileModal';
import MyDevicesModal from './MyDevicesModal';
import PetPassportModal from './PetPassportModal';

export default function ModalRoot() {
  const { activeModal } = useApp();

  if (!activeModal) return null;

  switch (activeModal) {
    case 'auth':
      return <AuthModal />;
    case 'addPet':
      return <AddPetModal />;
    case 'editProfile':
      return <EditProfileModal />;
    case 'booking':
      return <BookingModal />;
    case 'teleconsult':
      return <TeleConsultModal />;
    case 'cart':
      return <CartDrawer />;
    case 'checkout':
      return <CheckoutModal />;
    case 'orderTracker':
      return <OrderTrackerModal />;
    case 'review':
      return <ReviewModal />;
    case 'addRecord':
      return <AddRecordModal />;
    case 'editPrice':
      return <EditPriceModal />;
    case 'myDevices':
    case 'pairDevice':
      return <MyDevicesModal />;
    case 'petPassport':
      return <PetPassportModal />;
    default:
      return null;
  }
}
