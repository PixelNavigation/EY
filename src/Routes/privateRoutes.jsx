import Dashboard from '../Components/pages/Dashboard';
import LearningPath from '../Components/pages/LearningPath';
import MockInterview from '../Components/pages/MockInterview';
import PortfolioBuilder from '../Components/pages/PortfolioBuilder';
import Redeem from '../Components/pages/Redeem';

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
];