import { configureStore } from '@reduxjs/toolkit';
import AuthReducer from './features/AuthSlice';
import GuestReducer from './features/GuestSlice';
import RoomReducer from './features/RoomSlice';
import SalonServiceReducer from './features/Salon/SalonServicesSlice';
import SalonCustomerReducer from './features/Salon/SalonCustomerSlice';
import EmployeeReduces from './features/EMS/EmployeeSlice';
import ReportReduces from './features/ReportSlice';

const store = configureStore({
  reducer: {
    Auth: AuthReducer,
    Guest: GuestReducer,
    Room: RoomReducer,
    SalonServices: SalonServiceReducer,
    Salon: SalonCustomerReducer,
    Report: ReportReduces,
    Employee: EmployeeReduces,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // This disables the serializable check
    }).concat(),
});

export default store;
