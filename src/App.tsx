import { useState, useEffect } from "react";
import { Power, Zap, Clock, Activity, Plus, Sun, Moon, Monitor, Lightbulb, Fan, Flame, Tv, Coffee, Wifi, Battery, Volume2 } from "lucide-react";
import { Button } from "./components/ui/button";
import { Switch } from "./components/ui/switch";
import { Progress } from "./components/ui/progress";
import { Badge } from "./components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { toast } from "sonner@2.0.3";
import { Toaster } from "./components/ui/sonner";

// Device type definition
interface Device {
  id: string;
  name: string;
  type: string;
  power: number;
  isOn: boolean;
  timerDuration: number | null; // in seconds
  timerStartTime: number | null;
  registryId?: string;
}

// Activity log type
interface ActivityLog {
  id: string;
  deviceName: string;
  action: string;
  timestamp: Date;
}

// Electronic device registry type
interface ElectronicDevice {
  id: string;
  name: string;
  type: string;
  category: "Lighting" | "Climate" | "Entertainment" | "Appliances";
  power: number;
  isConnected: boolean;
}

// Pre-configured electronic devices
const electronicDevicesRegistry: ElectronicDevice[] = [
  // Lighting
  { id: "ED-LT-001", name: "Ceiling Bulb", type: "Light", category: "Lighting", power: 60, isConnected: false },
  { id: "ED-LT-002", name: "Desk Lamp", type: "Light", category: "Lighting", power: 15, isConnected: false },
  { id: "ED-LT-003", name: "Floor Lamp", type: "Light", category: "Lighting", power: 40, isConnected: false },
  { id: "ED-LT-004", name: "LED Strip", type: "Light", category: "Lighting", power: 25, isConnected: false },
  { id: "ED-LT-005", name: "Study Light", type: "Light", category: "Lighting", power: 20, isConnected: false },
  
  // Climate Control
  { id: "ED-CL-001", name: "Bedroom Fan", type: "Fan", category: "Climate", power: 75, isConnected: false },
  { id: "ED-CL-002", name: "Living Room Fan", type: "Fan", category: "Climate", power: 85, isConnected: false },
  { id: "ED-CL-003", name: "Ceiling Fan", type: "Fan", category: "Climate", power: 90, isConnected: false },
  { id: "ED-CL-004", name: "Living Room Heater", type: "Heater", category: "Climate", power: 1500, isConnected: false },
  { id: "ED-CL-005", name: "Portable Heater", type: "Heater", category: "Climate", power: 1200, isConnected: false },
  { id: "ED-CL-006", name: "Air Cooler", type: "Cooler", category: "Climate", power: 200, isConnected: false },
  
  // Entertainment
  { id: "ED-EN-001", name: "Smart TV", type: "TV", category: "Entertainment", power: 150, isConnected: false },
  { id: "ED-EN-002", name: "LED Monitor", type: "Monitor", category: "Entertainment", power: 45, isConnected: false },
  { id: "ED-EN-003", name: "Gaming Monitor", type: "Monitor", category: "Entertainment", power: 65, isConnected: false },
  { id: "ED-EN-004", name: "Sound System", type: "Speaker", category: "Entertainment", power: 80, isConnected: false },
  
  // Appliances
  { id: "ED-AP-001", name: "Coffee Maker", type: "Appliance", category: "Appliances", power: 1000, isConnected: false },
  { id: "ED-AP-002", name: "Router", type: "Router", category: "Appliances", power: 15, isConnected: false },
  { id: "ED-AP-003", name: "Charger Station", type: "Charger", category: "Appliances", power: 30, isConnected: false },
];

export default function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [registry, setRegistry] = useState<ElectronicDevice[]>(electronicDevicesRegistry);
  const [activeTab, setActiveTab] = useState<"devices" | "activity" | "registry">("devices");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light" | "auto">("dark");
  
  // Add device form state
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceType, setNewDeviceType] = useState("");
  const [newDevicePower, setNewDevicePower] = useState("");
  const [selectedRegistryDevice, setSelectedRegistryDevice] = useState("");

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("autosleep-theme") as "dark" | "light" | "auto" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme("dark");
    }
  }, []);

  const applyTheme = (newTheme: "dark" | "light" | "auto") => {
    if (newTheme === "auto") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    } else {
      document.documentElement.classList.toggle("dark", newTheme === "dark");
    }
  };

  const toggleTheme = () => {
    const themes: ("dark" | "light" | "auto")[] = ["dark", "light", "auto"];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
    localStorage.setItem("autosleep-theme", nextTheme);
    applyTheme(nextTheme);
  };

  const getThemeIcon = () => {
    if (theme === "light") return <Sun className="w-5 h-5" />;
    if (theme === "dark") return <Moon className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  // Play alarm sound
  const playAlarmSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const beep = (startTime: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, startTime + 0.2);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    };
    
    const now = audioContext.currentTime;
    beep(now);
    beep(now + 0.4);
    beep(now + 0.8);
  };

  // Add log entry
  const addLog = (deviceName: string, action: string) => {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      deviceName,
      action,
      timestamp: new Date(),
    };
    setActivityLog((prev) => [newLog, ...prev]);
  };

  // Toggle device power
  const toggleDevice = (deviceId: string) => {
    setDevices((prev) =>
      prev.map((device) => {
        if (device.id === deviceId) {
          const newIsOn = !device.isOn;
          
          // If turning on and timer is set, start the timer
          const timerStartTime = newIsOn && device.timerDuration ? Date.now() : null;
          
          addLog(
            device.name,
            newIsOn ? "Turned ON" : "Turned OFF"
          );
          
          return {
            ...device,
            isOn: newIsOn,
            timerStartTime,
          };
        }
        return device;
      })
    );
  };

  // Set timer for a device
  const setTimer = (deviceId: string, duration: number) => {
    setDevices((prev) =>
      prev.map((device) => {
        if (device.id === deviceId) {
          if (duration === 0) {
            // Clear timer
            addLog(device.name, "Timer cleared");
            return {
              ...device,
              timerDuration: null,
              timerStartTime: null,
            };
          }
          
          const timerStartTime = device.isOn ? Date.now() : null;
          addLog(
            device.name,
            `Timer set to ${formatDuration(duration)}`
          );
          
          return {
            ...device,
            timerDuration: duration,
            timerStartTime,
          };
        }
        return device;
      })
    );
  };

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  };

  // Calculate remaining time
  const getRemainingTime = (device: Device): number => {
    if (!device.isOn || !device.timerDuration || !device.timerStartTime) return 0;
    
    const elapsed = (Date.now() - device.timerStartTime) / 1000;
    const remaining = Math.max(0, device.timerDuration - elapsed);
    return remaining;
  };

  // Format remaining time for display
  const formatRemainingTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  // Timer check effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices((prev) =>
        prev.map((device) => {
          if (device.isOn && device.timerDuration && device.timerStartTime) {
            const remaining = getRemainingTime(device);
            
            if (remaining <= 0) {
              // Timer expired - turn off device
              playAlarmSound();
              toast.success(`${device.name} automatically turned OFF!`, {
                duration: 5000,
              });
              addLog(device.name, "Auto-shutdown (Timer expired)");
              
              return {
                ...device,
                isOn: false,
                timerStartTime: null,
              };
            }
          }
          return device;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Add new device
  const addDevice = () => {
    if (!newDeviceName.trim()) {
      toast.error("Please enter a device name");
      return;
    }

    let registryId = "";
    let deviceName = newDeviceName;
    let deviceType = newDeviceType;
    let devicePower = parseInt(newDevicePower);

    // If selected from registry, use those details
    if (selectedRegistryDevice) {
      const registryDevice = registry.find((d) => d.id === selectedRegistryDevice);
      if (registryDevice) {
        registryId = registryDevice.id;
        deviceName = registryDevice.name;
        deviceType = registryDevice.type;
        devicePower = registryDevice.power;
        
        // Mark as connected in registry
        setRegistry((prev) =>
          prev.map((d) => (d.id === selectedRegistryDevice ? { ...d, isConnected: true } : d))
        );
      }
    }

    const newDevice: Device = {
      id: Date.now().toString(),
      name: deviceName,
      type: deviceType || "Device",
      power: devicePower || 0,
      isOn: false,
      timerDuration: null,
      timerStartTime: null,
      registryId,
    };

    setDevices((prev) => [...prev, newDevice]);
    addLog(newDevice.name, "Device added");

    // Reset form
    setNewDeviceName("");
    setNewDeviceType("");
    setNewDevicePower("");
    setSelectedRegistryDevice("");
    setIsAddDialogOpen(false);

    toast.success(`${deviceName} added successfully!`);
  };

  // Remove device
  const removeDevice = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    if (device) {
      // Mark as disconnected in registry
      if (device.registryId) {
        setRegistry((prev) =>
          prev.map((d) => (d.id === device.registryId ? { ...d, isConnected: false } : d))
        );
      }

      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      addLog(device.name, "Device removed");
      toast.success(`${device.name} removed`);
    }
  };

  // Get device icon
  const getDeviceIcon = (type: string, isOn: boolean) => {
    const iconClass = "w-6 h-6";
    
    switch (type.toLowerCase()) {
      case "light":
      case "lamp":
      case "bulb":
        return <Lightbulb className={`${iconClass} ${isOn ? "animate-glow-pulse" : ""}`} />;
      case "fan":
      case "cooler":
        return <Fan className={`${iconClass} ${isOn ? "animate-spin-slow" : ""}`} />;
      case "heater":
        return <Flame className={`${iconClass} ${isOn ? "animate-flicker" : ""}`} />;
      case "tv":
      case "monitor":
        return <Tv className={`${iconClass} ${isOn ? "animate-screen-flicker" : ""}`} />;
      case "appliance":
        return <Coffee className={`${iconClass} ${isOn ? "animate-steam" : ""}`} />;
      case "router":
        return <Wifi className={`${iconClass} ${isOn ? "animate-signal-pulse" : ""}`} />;
      case "charger":
        return <Battery className={`${iconClass} ${isOn ? "animate-charge-pulse" : ""}`} />;
      case "speaker":
        return <Volume2 className={`${iconClass} ${isOn ? "animate-sound-bounce" : ""}`} />;
      default:
        return <Zap className={iconClass} />;
    }
  };

  // Calculate stats
  const activeDevicesCount = devices.filter((d) => d.isOn).length;
  const scheduledShutdowns = devices.filter((d) => d.timerDuration !== null).length;
  const totalPower = devices.filter((d) => d.isOn).reduce((sum, d) => sum + d.power, 0);

  // Filter registry by category
  const filteredRegistry =
    categoryFilter === "All"
      ? registry
      : registry.filter((d) => d.category === categoryFilter);

  // Get available registry devices (not connected)
  const availableRegistryDevices = registry.filter((d) => !d.isConnected);

  // Handle registry device selection
  const handleRegistrySelection = (deviceId: string) => {
    setSelectedRegistryDevice(deviceId);
    const device = registry.find((d) => d.id === deviceId);
    if (device) {
      setNewDeviceName(device.name);
      setNewDeviceType(device.type);
      setNewDevicePower(device.power.toString());
    }
  };

  return (
    <div className="min-h-screen transition-all duration-500" style={{ background: theme === "light" ? "#E8E5F5" : theme === "dark" ? "#2B1F5C" : "#5B4FB5" }}>
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl shadow-lg">
              <Power className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-white">AutoSleep</h1>
              <p className="text-white/70">Smart Timer System for Automatic Device Shutdown</p>
            </div>
          </div>

          <Button
            onClick={toggleTheme}
            variant="outline"
            className="bg-[#4A3F9A] border-transparent text-white hover:bg-[#3F3585] transition-all duration-300 flex items-center gap-2"
          >
            {getThemeIcon()}
            <span className="capitalize">{theme}</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#4A3F9A]/60 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-[#4A3F9A]/80 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer group animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 mb-2 group-hover:text-white transition-colors">Active Devices</p>
                <p className="text-white group-hover:scale-110 transition-transform inline-block">
                  {activeDevicesCount} <span className="text-white/50">/ {devices.length}</span>
                </p>
              </div>
              <div className="p-2 rounded-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <Power className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-[#4A3F9A]/60 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-[#4A3F9A]/80 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer group animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 mb-2 group-hover:text-white transition-colors">Scheduled Shutdowns</p>
                <p className="text-white group-hover:scale-110 transition-transform inline-block">{scheduledShutdowns} <span className="text-white/50">scheduled</span></p>
              </div>
              <div className="p-2 rounded-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-[#4A3F9A]/60 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-[#4A3F9A]/80 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer group animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 mb-2 group-hover:text-white transition-colors">Power Consumption</p>
                <p className="text-white group-hover:scale-110 transition-transform inline-block">{totalPower} <span className="text-white/50">W</span></p>
              </div>
              <div className="p-2 rounded-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <Zap className="w-5 h-5 text-purple-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("devices")}
            className={`px-6 py-3 rounded-full transition-all duration-300 whitespace-nowrap hover:scale-105 ${
              activeTab === "devices"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50"
                : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white hover:shadow-md"
            }`}
          >
            My Devices
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`px-6 py-3 rounded-full transition-all duration-300 whitespace-nowrap hover:scale-105 ${
              activeTab === "activity"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50"
                : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white hover:shadow-md"
            }`}
          >
            Activity Log
          </button>
          <button
            onClick={() => setActiveTab("registry")}
            className={`px-6 py-3 rounded-full transition-all duration-300 whitespace-nowrap hover:scale-105 ${
              activeTab === "registry"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50"
                : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white hover:shadow-md"
            }`}
          >
            Electronic Devices
          </button>
        </div>

        {/* My Devices Tab */}
        {activeTab === "devices" && (
          <div className="space-y-6">
            {/* Section Header with Add Device Button */}
            <div className="flex items-center justify-between animate-slide-in">
              <h2 className="text-white">My Devices</h2>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300 group">
                    <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    Add Device
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#4A3F9A] backdrop-blur-xl border-white/20 text-white animate-scale-in">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Device</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Select from Registry */}
                  {availableRegistryDevices.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-white/90">Select from Registry</Label>
                      <Select
                        value={selectedRegistryDevice}
                        onValueChange={handleRegistrySelection}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Choose a device..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#4A3F9A] border-white/20 text-white">
                          {availableRegistryDevices.map((device) => (
                            <SelectItem key={device.id} value={device.id} className="hover:bg-white/10">
                              {device.name} ({device.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {selectedRegistryDevice && (
                        <div className="p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
                          <p className="text-purple-200">
                            <span className="opacity-70">Device ID:</span> {selectedRegistryDevice}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {availableRegistryDevices.length > 0 && (
                    <div className="flex items-center gap-2 text-white/50">
                      <div className="flex-1 h-px bg-white/20"></div>
                      <span>OR</span>
                      <div className="flex-1 h-px bg-white/20"></div>
                    </div>
                  )}

                  {/* Manual Entry */}
                  <div className="space-y-2">
                    <Label className="text-white/90">Device Name</Label>
                    <Input
                      value={newDeviceName}
                      onChange={(e) => setNewDeviceName(e.target.value)}
                      placeholder="e.g., Bedroom Fan"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      disabled={!!selectedRegistryDevice}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/90">Device Type</Label>
                    <Input
                      value={newDeviceType}
                      onChange={(e) => setNewDeviceType(e.target.value)}
                      placeholder="e.g., Fan, Light, Heater"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      disabled={!!selectedRegistryDevice}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/90">Power (Watts)</Label>
                    <Input
                      value={newDevicePower}
                      onChange={(e) => setNewDevicePower(e.target.value)}
                      type="number"
                      placeholder="e.g., 75"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      disabled={!!selectedRegistryDevice}
                    />
                  </div>

                  <Button
                    onClick={addDevice}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Add Device
                  </Button>
                </div>
              </DialogContent>
              </Dialog>
            </div>

            {/* Devices List */}
            {devices.length === 0 ? (
              <div className="bg-transparent text-center py-20 animate-fade-in">
                <div className="flex justify-center mb-6">
                  <div className="animate-float">
                    <Zap className="w-24 h-24 text-purple-400/50" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-white/90 mb-2">No devices added yet</p>
                <p className="text-white/50">Click "Add Device" to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {devices.map((device, index) => {
                  const remaining = getRemainingTime(device);
                  const progress = device.timerDuration
                    ? ((device.timerDuration - remaining) / device.timerDuration) * 100
                    : 0;

                  return (
                    <div
                      key={device.id}
                      className={`backdrop-blur-sm rounded-2xl p-6 border hover:scale-[1.02] hover:shadow-lg transition-all duration-300 animate-fade-in group ${
                        device.isOn 
                          ? "bg-green-500/10 border-green-500/30 hover:bg-green-500/15 hover:shadow-green-500/20" 
                          : "bg-[#4A3F9A]/60 border-white/10 hover:bg-[#4A3F9A]/80 hover:shadow-purple-500/20"
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* Device Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-3 rounded-xl transition-all duration-300 ${device.isOn ? "bg-green-500/20" : "bg-white/10"}`}>
                            <div className={device.isOn ? "text-green-400" : "text-white/60"}>
                              {getDeviceIcon(device.type, device.isOn)}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-white group-hover:text-purple-200 transition-colors">
                              {device.name}
                            </h3>
                            <p className="text-white/50 group-hover:text-white/70 transition-colors">
                              {device.type} • {device.power}W
                            </p>
                            {device.registryId && (
                              <p className="text-purple-300/70 group-hover:text-purple-200 transition-colors">
                                ID: {device.registryId}
                              </p>
                            )}
                          </div>
                        </div>

                        <Badge
                          variant={device.isOn ? "default" : "secondary"}
                          className={`transition-all duration-300 ${
                            device.isOn
                              ? "bg-green-500/30 text-green-300 border-green-500/50"
                              : "bg-white/10 text-white/50 border-white/20"
                          }`}
                        >
                          {device.isOn ? "ON" : "OFF"}
                        </Badge>
                      </div>

                      {/* Power Switch */}
                      <div className="flex items-center justify-between mb-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300">
                        <span className="text-white/90 group-hover:text-white transition-colors">Power</span>
                        <Switch checked={device.isOn} onCheckedChange={() => toggleDevice(device.id)} />
                      </div>

                      {/* Timer Controls */}
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Select
                            value={device.timerDuration?.toString() || "0"}
                            onValueChange={(value) => setTimer(device.id, parseInt(value))}
                            key={`${device.id}-${device.timerDuration}`}
                          >
                            <SelectTrigger className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/15 transition-all">
                              <SelectValue placeholder="Select timer" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#4A3F9A] border-white/20 text-white">
                              <SelectItem value="0">No timer</SelectItem>
                              <SelectItem value="5">5 seconds (Test)</SelectItem>
                              <SelectItem value="60">1 minute</SelectItem>
                              <SelectItem value="1800">30 minutes</SelectItem>
                              <SelectItem value="3600">1 hour</SelectItem>
                              <SelectItem value="7200">2 hours</SelectItem>
                              <SelectItem value="10800">3 hours</SelectItem>
                              <SelectItem value="21600">6 hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Timer Ready (when OFF) */}
                        {!device.isOn && device.timerDuration && (
                          <div className="p-3 bg-amber-500/20 rounded-lg border border-amber-500/30 animate-fade-in">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-4 h-4 text-amber-300" />
                              <span className="text-amber-200">Timer ready:</span>
                              <Badge className="bg-amber-500/30 text-amber-100 border-amber-500/40">
                                {formatDuration(device.timerDuration)}
                              </Badge>
                            </div>
                            <p className="text-amber-200/70">
                              Turn on the device to start the countdown
                            </p>
                          </div>
                        )}

                        {/* Active Timer Progress */}
                        {device.isOn && device.timerDuration && remaining > 0 && (
                          <div className="space-y-2 animate-fade-in">
                            <div className="flex items-center justify-between">
                              <span className="text-white/70">Time remaining:</span>
                              <span className="text-white px-3 py-1 bg-purple-500/30 rounded-lg border border-purple-500/40 font-mono">
                                {formatRemainingTime(remaining)}
                              </span>
                            </div>
                            <div className="relative">
                              <Progress value={progress} className="h-2 bg-white/10" />
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-30 blur-sm animate-pulse-slow"></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="destructive"
                        onClick={() => removeDevice(device.id)}
                        className="w-full mt-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 hover:scale-[1.02] transition-all duration-300"
                      >
                        Remove Device
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Activity Log Tab */}
        {activeTab === "activity" && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 animate-slide-in">
              <Activity className="w-6 h-6 text-purple-300" />
              <h2 className="text-white">Activity Log</h2>
            </div>
            
            <div className="bg-[#4A3F9A]/60 backdrop-blur-sm rounded-2xl p-6 border border-white/10 animate-fade-in">
              {activityLog.length === 0 ? (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <div className="animate-float">
                      <Activity className="w-16 h-16 text-purple-400/50" strokeWidth={1.5} />
                    </div>
                  </div>
                  <p className="text-white/70">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {activityLog.map((log, index) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 hover:scale-[1.01] transition-all duration-300 cursor-pointer group animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div>
                        <p className="text-white group-hover:text-purple-200 transition-colors">
                          {log.deviceName}
                        </p>
                        <p className="text-white/50 group-hover:text-white/70 transition-colors">
                          {log.action}
                        </p>
                      </div>
                      <p className="text-white/50 group-hover:text-white/70 transition-colors">
                        {log.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Electronic Devices Registry Tab */}
        {activeTab === "registry" && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 animate-slide-in">
              <Zap className="w-6 h-6 text-purple-300" />
              <h2 className="text-white">Electronic Devices</h2>
            </div>
            
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 animate-fade-in">
              {["All", "Lighting", "Climate", "Entertainment", "Appliances"].map((category, index) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-4 py-2 rounded-full transition-all duration-300 whitespace-nowrap flex items-center gap-2 hover:scale-105 animate-slide-in ${
                    categoryFilter === category
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50"
                      : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {category === "Lighting" && <Lightbulb className={`w-4 h-4 ${categoryFilter === category ? "animate-glow-pulse" : ""}`} />}
                  {category === "Climate" && <Fan className={`w-4 h-4 ${categoryFilter === category ? "animate-spin-slow" : ""}`} />}
                  {category === "Entertainment" && <Tv className={`w-4 h-4 ${categoryFilter === category ? "animate-screen-flicker" : ""}`} />}
                  {category === "Appliances" && <Zap className="w-4 h-4" />}
                  {category}
                  <Badge className="bg-white/20 text-white border-white/30">
                    {category === "All"
                      ? registry.length
                      : registry.filter((d) => d.category === category).length}
                  </Badge>
                </button>
              ))}
            </div>

            {/* Registry Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRegistry.map((device, index) => (
                <div
                  key={device.id}
                  className={`backdrop-blur-sm rounded-2xl p-6 border hover:scale-[1.02] hover:shadow-lg transition-all duration-300 group cursor-pointer animate-fade-in ${
                    device.isConnected 
                      ? "bg-green-500/10 border-green-500/30 hover:bg-green-500/15 hover:shadow-green-500/20" 
                      : "bg-[#4A3F9A]/60 border-white/10 hover:bg-[#4A3F9A]/80 hover:shadow-purple-500/20"
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl transition-all duration-300 ${device.isConnected ? "bg-green-500/20" : "bg-white/10"}`}>
                        <div className={device.isConnected ? "text-green-400" : "text-white/60"}>
                          {getDeviceIcon(device.type, device.isConnected)}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-white group-hover:text-purple-200 transition-colors">
                          {device.name}
                        </h3>
                        <p className="text-white/50 group-hover:text-white/70 transition-colors">
                          {device.type}
                        </p>
                      </div>
                    </div>

                    <Badge
                      className={`transition-all duration-300 ${
                        device.isConnected
                          ? "bg-green-500/20 text-green-300 border-green-500/30 shadow-lg shadow-green-500/20"
                          : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                      }`}
                    >
                      {device.isConnected ? "✓ Connected" : "Available"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-all">
                      <span className="text-white/70 group-hover:text-white/90 transition-colors">Device ID</span>
                      <span className="text-white px-3 py-1 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-lg border border-purple-500/30 font-mono">
                        {device.id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-all">
                      <span className="text-white/70 group-hover:text-white/90 transition-colors">Category</span>
                      <span className="text-white/90">{device.category}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-all">
                      <span className="text-white/70 group-hover:text-white/90 transition-colors">Power</span>
                      <span className="text-white/90">{device.power}W</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Toaster />

      {/* Custom Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes glow-pulse {
          0%, 100% { 
            opacity: 1;
            filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.8));
          }
          50% { 
            opacity: 0.7;
            filter: drop-shadow(0 0 12px rgba(250, 204, 21, 1));
          }
        }
        
        @keyframes flicker {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 6px rgba(251, 146, 60, 0.8)); }
          50% { opacity: 0.8; filter: drop-shadow(0 0 10px rgba(251, 146, 60, 1)); }
        }
        
        @keyframes screen-flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; }
        }
        
        @keyframes steam {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        
        @keyframes signal-pulse {
          0%, 100% { 
            transform: scale(1);
            filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.5));
          }
          50% { 
            transform: scale(1.1);
            filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8));
          }
        }
        
        @keyframes charge-pulse {
          0%, 100% { 
            filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.5));
          }
          50% { 
            filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.8));
          }
        }
        
        @keyframes sound-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        
        @keyframes icon-glow {
          0%, 100% { 
            box-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
          }
          50% { 
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.6);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        .animate-slide-in {
          animation: slide-in 0.6s ease-out forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
        
        .animate-glow-pulse {
          animation: glow-pulse 2s ease-in-out infinite;
        }
        
        .animate-flicker {
          animation: flicker 1.5s ease-in-out infinite;
        }
        
        .animate-screen-flicker {
          animation: screen-flicker 3s ease-in-out infinite;
        }
        
        .animate-steam {
          animation: steam 2s ease-in-out infinite;
        }
        
        .animate-signal-pulse {
          animation: signal-pulse 2s ease-in-out infinite;
        }
        
        .animate-charge-pulse {
          animation: charge-pulse 2s ease-in-out infinite;
        }
        
        .animate-sound-bounce {
          animation: sound-bounce 0.5s ease-in-out infinite;
        }
        
        .animate-icon-glow {
          animation: icon-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
