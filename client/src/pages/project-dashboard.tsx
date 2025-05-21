import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/context/user-context";
import {
  BarChart,
  Calendar,
  Clock,
  Database,
  GitBranch,
  GitMerge,
  Globe,
  Grid,
  Laptop,
  LogOut,
  Plus,
  Settings,
  Users,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

// Mock data for projects
const projects = [
  {
    id: 1,
    name: "E-commerce Platform",
    description: "Automated testing for our online store application",
    status: "active",
    lastUpdated: "2025-03-10T14:48:00",
    progress: 78,
    testCount: 24,
    members: 5,
  },
  {
    id: 2,
    name: "Banking Dashboard",
    description: "End-to-end test suite for customer banking portal",
    status: "active",
    lastUpdated: "2025-03-15T09:32:00",
    progress: 45,
    testCount: 18,
    members: 3,
  },
  {
    id: 3,
    name: "HR Management System",
    description: "API and database testing for employee management",
    status: "paused",
    lastUpdated: "2025-02-28T11:20:00",
    progress: 92,
    testCount: 32,
    members: 4,
  },
];

// Component for project card
const ProjectCard = ({ project, onSelect }: { project: any, onSelect: (project: any) => void }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{project.name}</CardTitle>
            <CardDescription className="mt-1">{project.description}</CardDescription>
          </div>
          <Badge variant={project.status === "active" ? "default" : "secondary"}>
            {project.status === "active" ? "Active" : "Paused"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full" 
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1 text-gray-500" />
              <span className="text-gray-600">
                {new Date(project.lastUpdated).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center">
              <GitBranch className="h-4 w-4 mr-1 text-gray-500" />
              <span className="text-gray-600">{project.testCount} tests</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex -space-x-2">
          {Array.from({ length: project.members }).map((_, i) => (
            <Avatar key={i} className="border-2 border-white w-8 h-8">
              <AvatarFallback className="bg-gray-300 text-xs">
                {String.fromCharCode(65 + i)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <Button onClick={() => onSelect(project)}>
          Open Project
        </Button>
      </CardFooter>
    </Card>
  );
};

// Component for creating a new project
const NewProjectDialog = ({ open, onOpenChange, onProjectCreated }: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  onProjectCreated: (project: any) => void 
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [testingType, setTestingType] = useState("");
  
  const handleCreate = () => {
    if (!name || !description || !testingType) return;
    
    const newProject = {
      id: Date.now(),
      name,
      description,
      status: "active",
      lastUpdated: new Date().toISOString(),
      progress: 0,
      testCount: 0,
      members: 1,
      testingType
    };
    
    onProjectCreated(newProject);
    setName("");
    setDescription("");
    setTestingType("");
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set up a new testing project for your application.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Project Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your testing project"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="testing-type" className="text-sm font-medium">
              Primary Testing Type
            </label>
            <Select value={testingType} onValueChange={setTestingType}>
              <SelectTrigger>
                <SelectValue placeholder="Select testing type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ui">UI Automation</SelectItem>
                <SelectItem value="api">API Testing</SelectItem>
                <SelectItem value="db">Database Testing</SelectItem>
                <SelectItem value="cross-browser">Cross-Browser Testing</SelectItem>
                <SelectItem value="performance">Performance Testing</SelectItem>
                <SelectItem value="all-in-one">All-in-One Testing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name || !description || !testingType}>
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main dashboard component
export default function ProjectDashboard() {
  const [userProjects, setUserProjects] = useState([...projects]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [selectedTestingMode, setSelectedTestingMode] = useState("record-play");
  const { authState, logout } = useUser();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    // If user is not authenticated, redirect to landing page
    if (!authState.isLoading && !authState.isAuthenticated) {
      navigate("/");
    }
  }, [authState.isAuthenticated, authState.isLoading, navigate]);

  const handleCreateProject = (project: any) => {
    setUserProjects([project, ...userProjects]);
  };

  const handleSelectProject = (project: any) => {
    setSelectedProject(project);

    if (project.testingTpe=="api") {
      window.location.href="/api-test";
    }
    else if (project.testingType=="drag-drop") {
      window.location.href="/drag-drop";
    }
    else if (project.testingType=="recorder") {
      window.location.href="/test-recorder";
    }
    else{
      window.location.href="/test-builder";
    }
  };

  const renderProjectContent = () => {
    if (!selectedProject) return null;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h2>
            <p className="text-gray-600">{selectedProject.description}</p>
          </div>
          <div className="flex space-x-2 items-center">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">
                  <div className="flex items-center">
                    <GitBranch className="h-4 w-4 mr-2" />
                    <span>main</span>
                  </div>
                </SelectItem>
                <SelectItem value="personal">
                  <div className="flex items-center">
                    <GitBranch className="h-4 w-4 mr-2" />
                    <span>personal</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {selectedBranch === 'personal' && (
              <Button variant="outline" size="sm">
                <GitMerge className="h-4 w-4 mr-2" />
                Merge to main
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="testing" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="testing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Testing Approach</CardTitle>
                <CardDescription>
                  Choose how you want to create your tests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTestingMode === "record-play" ? "border-2 border-indigo-500 bg-indigo-50/50" : ""
                    }`}
                    onClick={() =>{ setSelectedTestingMode("record-play");
                      window.location.href = "/test-recorder";
                      // Navigate to recorder
                      // or handle it in the same page
                    }}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <Clock className="h-5 w-5 mr-2 text-indigo-600" />
                        Record & Play
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm">
                        Record your interactions with the application and convert them to automated tests.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTestingMode === "drag-drop" ? "border-2 border-indigo-500 bg-indigo-50/50" : ""
                    }`}
                    onClick={() =>{ setSelectedTestingMode("drag-drop");
                      window.location.href = "/drag-drop";
                      // Navigate to drag-drop builder
                      // or handle it in the same page
                    }}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <Grid className="h-5 w-5 mr-2 text-indigo-600" />
                        Drag & Drop
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm">
                        Build tests visually by dragging actions, assertions, and other test components.
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="pt-4">
                  <h3 className="text-lg font-medium mb-3">Testing Types</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { icon: <Laptop size={20} />, name: "UI Automation" },
                      { icon: <Database size={20} />, name: "Database Testing" },
                      { icon: <Zap size={20} />, name: "API Testing" },
                      { icon: <Globe size={20} />, name: "Cross-Browser" },
                      { icon: <BarChart size={20} />, name: "Performance" },
                      { icon: <Grid size={20} />, name: "All-in-One" },
                    ].map((type, i) => (
                      <Card 
                        key={i} 
                        className="cursor-pointer hover:shadow-sm transition-shadow"
                        onClick={() => {
                          if (selectedTestingMode === "record-play") {
                            window.location.href = "/recorder";
                          } else {
                            // Navigate to drag-drop builder
                          }
                        }}
                      >
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                            {type.icon}
                          </div>
                          <p className="text-sm font-medium">{type.name}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>
                  View and analyze your test execution results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center text-gray-500">
                  <BarChart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Test Results Yet</h3>
                  <p>Run some tests to see results and analytics here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Reports</CardTitle>
                <CardDescription>
                  Track your testing metrics and generate reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center text-gray-500">
                  <BarChart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Analytics Available</h3>
                  <p>Run some tests to see analytics and reports here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
                <CardDescription>
                  Manage your project configuration and members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Basic Information</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Project Name</label>
                        <Input value={selectedProject.name} onChange={() => {}} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <Select defaultValue={selectedProject.status}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Input value={selectedProject.description} onChange={() => {}} />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Team Members</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">Manage who has access to this project</p>
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Invite Members
                      </Button>
                    </div>
                    <Card>
                      <div className="divide-y">
                        {Array.from({ length: selectedProject.members }).map((_, i) => (
                          <div key={i} className="flex items-center justify-between p-3">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3">
                                <AvatarFallback className="bg-gray-200 text-xs">
                                  {String.fromCharCode(65 + i)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {i === 0 ? "You" : `Team Member ${i}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {i === 0 ? "Owner" : "Editor"}
                                </p>
                              </div>
                            </div>
                            {i > 0 && (
                              <Select defaultValue="editor">
                                <SelectTrigger className="w-[110px] h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                  <SelectItem value="editor">Editor</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Danger Zone</h3>
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Delete this project</p>
                          <p className="text-sm text-gray-600">
                            Once deleted, it cannot be recovered
                          </p>
                        </div>
                        <Button variant="destructive" size="sm">
                          Delete Project
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navigation */}
      <header className="border-b bg-white px-4 py-3 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent flex items-center">
              <div className="w-8 h-8 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white mr-2">
                N
              </div>
              NextGen Automation
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <div className="flex items-center space-x-2 border-l pl-4 ml-2">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback>
                  {authState.user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{authState.user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{authState.user?.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only md:not-sr-only md:ml-2">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {!selectedProject ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
                <p className="text-gray-600">
                  Manage and create testing projects
                </p>
              </div>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onSelect={handleSelectProject}
                />
              ))}
            </div>
          </>
        ) : (
          renderProjectContent()
        )}
      </main>
      
      <NewProjectDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        onProjectCreated={handleCreateProject} 
      />
    </div>
  );
}