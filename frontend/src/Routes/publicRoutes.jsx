import About from '../Components/pages/About';
import Features from '../Components/pages/Features';
import Pricing from '../Components/pages/Pricing';
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