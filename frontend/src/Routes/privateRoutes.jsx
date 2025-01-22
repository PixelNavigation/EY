import Dashboard from '../Components/pages/Dashboard';
import LearningPath from '../Components/pages/LearningPath';
import MockInterview from '../Components/pages/AIMockInterview';
import PortfolioBuilder from '../Components/pages/PortfolioBuilder';
import Redeem from '../Components/pages/Redeem';
import Profile from '../Components/pages/Profile';

export const privateRoutes = [
    {
        path: '/dashboard',
        component: Dashboard,
    },
    {
        path: '/learning-path',
        component: LearningPath,
    },
    {
        path: '/mock-interview',
        component: MockInterview,
    },
    {
        path: '/portfolio-builder',
        component: PortfolioBuilder,
    },
    {
        path: '/redeem',
        component: Redeem,
    },
    {
        path: '/profile',
        component: Profile,
    },
];