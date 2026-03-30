"use client"

import { useEffect, useState, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { Loader2, MapPin, ExternalLink, Info } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

// Helper to fix Leaflet's default icon issue in Next.js
const getCustomIcon = () => {
  if (typeof window === 'undefined') return null;
  const L = require("leaflet");
  return new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

type ProjectLocation = {
  _id: string;
  name: string;
  status: string;
  budgetAllocated: number;
  location: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  planId?: {
    title: string;
  };
}

export default function ProjectMap() {
  const [projects, setProjects] = useState<ProjectLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [icon, setIcon] = useState<any>(null)
  const [filter, setFilter] = useState<string>("ALL")

  useEffect(() => {
    setIsMounted(true)
    setIcon(getCustomIcon())
    
    fetch('/api/projects/locations')
      .then(res => res.json())
      .then(data => {
        setProjects(Array.isArray(data) ? data : [])
      })
      .catch(err => console.error("Failed to fetch project locations", err))
      .finally(() => setLoading(false))
  }, [])

  const filteredProjects = useMemo(() => {
    if (filter === "ALL") return projects;
    return projects.filter(p => p.status === filter);
  }, [projects, filter]);

  const defaultCenter: [number, number] = [13.7563, 100.5018] // Bangkok default
  
  const mapCenter = useMemo(() => {
    if (projects.length === 0) return defaultCenter;
    let lat = 0, lng = 0;
    projects.forEach(p => {
      lng += p.location.coordinates[0];
      lat += p.location.coordinates[1];
    });
    return [lat / projects.length, lng / projects.length] as [number, number];
  }, [projects]);

  if (!isMounted) return <div className="h-full w-full animate-pulse bg-muted rounded-md" />

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-muted/30 rounded-md border border-dashed border-muted-foreground/20">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <p className="mt-2 text-xs text-muted-foreground">กำลังโหลดข้อมูลแผนที่...</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full rounded-md overflow-hidden relative z-0 border shadow-inner">
      <MapContainer
        center={mapCenter}
        zoom={projects.length > 0 ? 8 : 6}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {projects.length > 0 && <ChangeView center={mapCenter} zoom={8} />}

        {filteredProjects.map((project) => (
          <Marker 
            key={project._id} 
            position={[project.location.coordinates[1], project.location.coordinates[0]]} 
            icon={icon}
          >
            <Popup className="project-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-sm text-primary leading-tight">{project.name}</h3>
                  <Badge variant={project.status === "COMPLETED" ? "default" : project.status === "IN_PROGRESS" ? "secondary" : "outline"} className="text-[10px] h-4 px-1 shrink-0 ml-2">
                    {project.status}
                  </Badge>
                </div>
                
                <p className="text-[11px] text-muted-foreground mb-3 italic">
                  {project.planId?.title || "ไม่ระบุแผนยุทธศาสตร์"}
                </p>
                
                <div className="grid grid-cols-2 gap-2 mb-4 bg-muted/50 p-2 rounded text-[10px]">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground uppercase tracking-wider">งบประมาณ</span>
                    <span className="font-bold">฿{project.budgetAllocated?.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-muted-foreground uppercase tracking-wider">พิกัด</span>
                    <span className="font-mono">{project.location.coordinates[1].toFixed(4)}, {project.location.coordinates[0].toFixed(4)}</span>
                  </div>
                </div>

                <Link 
                  href={`/dashboard/projects/${project._id}`}
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  ดูรายละเอียดโครงการ
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}

        {projects.length === 0 && (
          <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-lg border shadow-lg max-w-[200px]">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Info className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">ไม่พบข้อมูล</span>
            </div>
            <p className="text-[10px] text-muted-foreground">ยังไม่มีโครงการที่ระบุพิกัดสถานที่ในขณะนี้</p>
          </div>
        )}
      </MapContainer>

      {/* Filter Overlay */}
      <div className="absolute top-20 right-4 z-[1000] flex flex-col gap-2">
         {["ALL", "IN_PROGRESS", "COMPLETED", "PLANNED"].map((f) => (
           <button
             key={f}
             onClick={() => setFilter(f)}
             className={`px-3 py-1.5 text-[10px] font-bold rounded-full border shadow-sm transition-all ${
               filter === f 
                 ? "bg-primary text-white border-primary" 
                 : "bg-white/90 backdrop-blur-md text-slate-600 border-slate-200 hover:bg-white"
             }`}
           >
             {f === "ALL" ? "ทั้งหมด" : f}
           </button>
         ))}
      </div>
    </div>
  )
}
