import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import AdminDashboard from "@/pages/AdminDashboard";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Library from "./pages/Library";
import ArticleDetail from "./pages/ArticleDetail";
import Forum from "./pages/Forum";
import ForumPost from "./pages/ForumPost";
import ForumNewPost from "./pages/ForumNewPost";
import Videos from "./pages/Videos";
import Search from "./pages/Search";
import Treatment from "./pages/Treatment";
import TreatmentWizard from "./pages/TreatmentWizard";
import Meetings from "./pages/Meetings";
import Events from "./pages/Events";
import Resources from "./pages/Resources";
import ResourceMap from "./pages/ResourceMap";
import MediCalProviders from "./pages/MediCalProviders";
import Favorites from "./pages/Favorites";
import Map from "./pages/Map";
import Profile from "./pages/Profile";
import Onboarding from "./pages/Onboarding";
import Calendar from "./pages/Calendar";
import FloatingAIAssistant from "./components/FloatingAIAssistant";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/chat"} component={Chat} />
      <Route path={"/library"} component={Library} />
      <Route path={"/library/:slug"} component={ArticleDetail} />
      <Route path={"/forum"} component={Forum} />
      <Route path={"/forum/new"} component={ForumNewPost} />
      <Route path={"/forum/:id"} component={ForumPost} />
      <Route path={"/videos"} component={Videos} />
      <Route path="/search" component={Search} />
      <Route path="/treatment" component={Treatment} />
      <Route path="/treatment/wizard" component={TreatmentWizard} />
      <Route path="/meetings" component={Meetings} />
      <Route path="/events" component={Events} />
      <Route path="/resources" component={Resources} />
      <Route path="/resources/map" component={ResourceMap} />
      <Route path="/medical-providers" component={MediCalProviders} />
      <Route path="/map" component={Map} />
      <Route path={"/favorites"} component={Favorites} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/profile/:userId"} component={Profile} />
      <Route path={"/onboarding"} component={Onboarding} />
      <Route path={"/calendar"} component={Calendar} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
          <FloatingAIAssistant />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
