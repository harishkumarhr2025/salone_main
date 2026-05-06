import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import Loadable from '../layouts/full/shared/loadable/Loadable';
import Protected from 'src/components/Protected';
import PublicRoute from 'src/components/PublicRoute';

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));

/* ****Pages***** */
const Dashboard = Loadable(lazy(() => import('../views/dashboard/Dashboard')));

const Error = Loadable(lazy(() => import('../views/authentication/Error')));
const Register = Loadable(lazy(() => import('../views/authentication/Register')));
const Login = Loadable(lazy(() => import('../views/authentication/Login')));
const Agents = Loadable(lazy(() => import('../views/Agents/Agents')));
const Home = Loadable(lazy(() => import('../views/Home/Home')));
const AboutUS = Loadable(lazy(() => import('../views/QuickLinks/AboutUs')));
const FAQ = Loadable(lazy(() => import('../views/QuickLinks/FAQ')));
const PrivacyPolicy = Loadable(lazy(() => import('../views/QuickLinks/PrivacyPolicy')));
const TNC = Loadable(lazy(() => import('../views/QuickLinks/TNC')));
const Salon = Loadable(lazy(() => import('../views/Salon/Salon')));
const SalonServices = Loadable(lazy(() => import('../views/Salon/SalonServices')));
const SalonReport = Loadable(lazy(() => import('../views/Salon/SalonReport')));
const Employee = Loadable(lazy(() => import('../views/Employee/Employee')));
const Roles = Loadable(lazy(() => import('../views/Roles/Roles')));
const ProductManagement = Loadable(
  lazy(() => import('../views/ProductManagement/ProductManagement')),
);

const Router = [
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/auth/login', element: <PublicRoute Component={Login} /> },
      { path: '/auth/register', element: <PublicRoute Component={Register} /> },
      { path: '/auth/404', element: <Error /> },
    ],
  },
  {
    path: '/',
    element: <FullLayout />,
    children: [
      {
        path: '/dashboard',
        element: <Protected Component={Dashboard} allowedRoles={['admin', 'semi_admin', 'user']} />,
      },
      { path: '/agents', element: <Protected Component={Agents} /> },
      { path: '/salon-management', element: <Protected Component={Salon} /> },
      { path: '/salon-services', element: <Protected Component={SalonServices} /> },
      { path: '/salon-report', element: <Protected Component={SalonReport} allowedRoles={['admin']} /> },
      { path: '/roles', element: <Protected Component={Roles} allowedRoles={['admin']} /> },
      { path: '/product-manage', element: <Protected Component={ProductManagement} /> },
      { path: '/manage-employee', element: <Protected Component={Employee} /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
];

export default Router;
