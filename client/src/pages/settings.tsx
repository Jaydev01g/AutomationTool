import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  
  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been updated",
    });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 mt-1">Configure your automation testing environment</p>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="recording">Recording</TabsTrigger>
          <TabsTrigger value="browsers">Browsers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure the general settings for your testing environment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" defaultValue="automation_user" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input id="projectName" defaultValue="My Automation Project" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultTimeout">Default Timeout (seconds)</Label>
                <Input id="defaultTimeout" type="number" defaultValue="30" min="1" max="300" />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="notifications" className="flex-1">Enable Notifications</Label>
                <Switch id="notifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="autoSave" className="flex-1">Auto-save Tests</Label>
                <Switch id="autoSave" defaultChecked />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="recording">
          <Card>
            <CardHeader>
              <CardTitle>Recording Settings</CardTitle>
              <CardDescription>
                Configure how test recording works
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="elementTimeout">Element Detection Timeout (seconds)</Label>
                <Input id="elementTimeout" type="number" defaultValue="10" min="1" max="60" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stepDelay">Step Delay (milliseconds)</Label>
                <Input id="stepDelay" type="number" defaultValue="500" min="0" max="5000" step="100" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="screenshotMode">Screenshot Capture</Label>
                <Select defaultValue="onFailure">
                  <SelectTrigger id="screenshotMode">
                    <SelectValue placeholder="Select when to take screenshots" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="onFailure">On Failure</SelectItem>
                    <SelectItem value="always">For Each Step</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="recordHovers" className="flex-1">Record Hover Events</Label>
                <Switch id="recordHovers" />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="smartDetection" className="flex-1">Smart Element Detection</Label>
                <Switch id="smartDetection" defaultChecked />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="browsers">
          <Card>
            <CardHeader>
              <CardTitle>Browser Settings</CardTitle>
              <CardDescription>
                Configure browser-specific settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="defaultBrowser">Default Browser</Label>
                <Select defaultValue="Chrome">
                  <SelectTrigger id="defaultBrowser">
                    <SelectValue placeholder="Select default browser" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chrome">Chrome</SelectItem>
                    <SelectItem value="Firefox">Firefox</SelectItem>
                    <SelectItem value="Safari">Safari</SelectItem>
                    <SelectItem value="Edge">Edge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="windowSize">Default Window Size</Label>
                <Select defaultValue="1920x1080">
                  <SelectTrigger id="windowSize">
                    <SelectValue placeholder="Select window size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1366x768">1366 x 768</SelectItem>
                    <SelectItem value="1440x900">1440 x 900</SelectItem>
                    <SelectItem value="1920x1080">1920 x 1080</SelectItem>
                    <SelectItem value="responsive">Responsive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="headless" className="flex-1">Run in Headless Mode</Label>
                <Switch id="headless" />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="incognito" className="flex-1">Use Incognito/Private Mode</Label>
                <Switch id="incognito" defaultChecked />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="userAgent">Custom User Agent (optional)</Label>
                <Input id="userAgent" placeholder="Enter custom user agent string" />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
