import About from '../components/pages/About';
import Features from '../components/pages/Features';
import Pricing from '../components/pages/Pricing';
import Login from '../Components/auth/Login';

export const publicRoutes = [
    {
        path: '/about',
        component: About,
    },
    {
        path: '/features',
        component: Features,
    },
    {
        path: '/pricing',
        component: Pricing,
    },
    {
        path: '/login',
        component: Login,
    },
];