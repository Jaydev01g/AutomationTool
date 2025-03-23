import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Settings() {
  const { toast } = useToast();
  const [generalSettings, setGeneralSettings] = useState({
    defaultBrowser: 'chrome',
    defaultWaitTimeout: 5000,
    screenshotOnError: true,
    saveReportsLocally: true,
    recordVideo: false
  });

  const [advancedSettings, setAdvancedSettings] = useState({
    headlessMode: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    userAgent: '',
    maxConcurrentExecutions: 2
  });

  const handleSaveGeneral = () => {
    // In real app, save to server
    fetch('/api/settings/general', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(generalSettings),
    })
      .then(() => {
        toast({
          title: "Settings saved",
          description: "General settings have been updated"
        });
      })
      .catch(error => {
        toast({
          title: "Error saving settings",
          description: error.message,
          variant: "destructive"
        });
      });
  };

  const handleSaveAdvanced = () => {
    // In real app, save to server
    fetch('/api/settings/advanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(advancedSettings),
    })
      .then(() => {
        toast({
          title: "Settings saved",
          description: "Advanced settings have been updated"
        });
      })
      .catch(error => {
        toast({
          title: "Error saving settings",
          description: error.message,
          variant: "destructive"
        });
      });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600">Configure your testing environment and preferences</p>
      </div>

      <Tabs defaultValue="general" className="max-w-4xl">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic settings for test recording and execution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Default Browser</Label>
                  <Select 
                    value={generalSettings.defaultBrowser}
                    onValueChange={(value) => setGeneralSettings({...generalSettings, defaultBrowser: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select browser" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chrome">Chrome</SelectItem>
                      <SelectItem value="firefox">Firefox</SelectItem>
                      <SelectItem value="edge">Edge</SelectItem>
                      <SelectItem value="safari">Safari</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Default Wait Timeout (ms)</Label>
                  <Input 
                    type="number" 
                    value={generalSettings.defaultWaitTimeout}
                    onChange={(e) => setGeneralSettings({...generalSettings, defaultWaitTimeout: parseInt(e.target.value)})}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum time to wait for elements to appear, in milliseconds
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Take Screenshots on Error</Label>
                    <p className="text-xs text-gray-500">
                      Automatically capture screenshots when a test fails
                    </p>
                  </div>
                  <Switch 
                    checked={generalSettings.screenshotOnError}
                    onCheckedChange={(checked) => setGeneralSettings({...generalSettings, screenshotOnError: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Save Reports Locally</Label>
                    <p className="text-xs text-gray-500">
                      Save test execution reports to your local machine
                    </p>
                  </div>
                  <Switch 
                    checked={generalSettings.saveReportsLocally}
                    onCheckedChange={(checked) => setGeneralSettings({...generalSettings, saveReportsLocally: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Record Test Execution Video</Label>
                    <p className="text-xs text-gray-500">
                      Record video of test executions for debugging
                    </p>
                  </div>
                  <Switch 
                    checked={generalSettings.recordVideo}
                    onCheckedChange={(checked) => setGeneralSettings({...generalSettings, recordVideo: checked})}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveGeneral}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Configure advanced browser and execution settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Headless Mode</Label>
                    <p className="text-xs text-gray-500">
                      Run tests without visible browser UI
                    </p>
                  </div>
                  <Switch 
                    checked={advancedSettings.headlessMode}
                    onCheckedChange={(checked) => setAdvancedSettings({...advancedSettings, headlessMode: checked})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Viewport Width (px)</Label>
                    <Input 
                      type="number" 
                      value={advancedSettings.viewportWidth}
                      onChange={(e) => setAdvancedSettings({...advancedSettings, viewportWidth: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Viewport Height (px)</Label>
                    <Input 
                      type="number" 
                      value={advancedSettings.viewportHeight}
                      onChange={(e) => setAdvancedSettings({...advancedSettings, viewportHeight: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Custom User Agent (optional)</Label>
                  <Input 
                    value={advancedSettings.userAgent}
                    onChange={(e) => setAdvancedSettings({...advancedSettings, userAgent: e.target.value})}
                    placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
                  />
                </div>
                
                <div>
                  <Label>Maximum Concurrent Executions</Label>
                  <Input 
                    type="number" 
                    value={advancedSettings.maxConcurrentExecutions}
                    onChange={(e) => setAdvancedSettings({...advancedSettings, maxConcurrentExecutions: parseInt(e.target.value)})}
                    min={1}
                    max={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum number of tests that can run simultaneously
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveAdvanced}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>
                Connect TestFlow with external tools and services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">GitHub Integration</h3>
                      <p className="text-sm text-gray-500">Connect to GitHub for test synchronization</p>
                    </div>
                    <Button variant="outline">Connect</Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Sync your test cases with GitHub repositories and trigger test runs from commits.
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">Slack Notifications</h3>
                      <p className="text-sm text-gray-500">Send test results to Slack</p>
                    </div>
                    <Button variant="outline">Configure</Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Get notified about test results and failures in your Slack channels.
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">CI/CD Integration</h3>
                      <p className="text-sm text-gray-500">Connect to CI/CD pipelines</p>
                    </div>
                    <Button variant="outline">Configure</Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Integrate with Jenkins, CircleCI, GitHub Actions and other CI/CD providers.
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">API Access</h3>
                      <p className="text-sm text-gray-500">Manage API tokens</p>
                    </div>
                    <Button variant="outline">Generate Token</Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Generate API tokens to access TestFlow programmatically.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
