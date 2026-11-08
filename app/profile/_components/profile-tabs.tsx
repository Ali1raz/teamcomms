import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireSession } from "../data/require-session";
import { userGetAllSessions } from "../data/user-get-all-sessions";
import { UpdateProfileForm } from "./update-profile-form";
import { UserSessionsCard } from "./user-sessions-tab";

const ProfileTabs = async () => {
  const [sessions, currentSession] = await Promise.all([
    userGetAllSessions(),
    requireSession(),
  ]);

  return (
    <div className="w-full max-w-5xl mb-8">
      <Tabs defaultValue={"update-profile"} className="gap-4">
        <TabsList variant="line" className="sm:**:px-6 **:px-4">
          <TabsTrigger value={"update-profile"}>Profile</TabsTrigger>
          <TabsTrigger value={"sessions"}>Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="update-profile">
          <UpdateProfileForm session={currentSession} />
        </TabsContent>

        <TabsContent value="sessions">
          <UserSessionsCard
            sessions={sessions}
            currentToken={currentSession.session.token}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileTabs;
