// C:\Users\Prasannakumar\Downloads\affiliate-command-center\frontend\components\add-network-dialog.tsx

"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, Link2, Zap, Briefcase, Target, DollarSign, ShoppingCart, Upload } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Define the AffiliateNetwork interface
interface AffiliateNetwork {
  id: string;
  name: string;
  icon: LucideIcon;
}

// List of available affiliate networks
const affiliateNetworks: AffiliateNetwork[] = [
  { id: "amazon-associates", name: "Amazon Associates", icon: ShoppingCart },
  { id: "cj", name: "Commission Junction", icon: Link2 },
  { id: "impact", name: "Impact", icon: Zap },
  { id: "shareasale", name: "ShareASale", icon: Briefcase },
  { id: "rakuten", name: "Rakuten Advertising", icon: Target },
  { id: "clickbank", name: "ClickBank", icon: DollarSign },
];

interface AddNetworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNetworkConnected?: (networkId: string, name: string) => void;
}

export function AddNetworkDialog({ open, onOpenChange, onNetworkConnected }: AddNetworkDialogProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<AffiliateNetwork | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [affiliateId, setAffiliateId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConnect = (network: AffiliateNetwork) => {
    setSelectedNetwork(network);
    setApiKey("");
    setAffiliateId("");
    setFile(null);
  };

  const handleSaveConnection = () => {
    if (!selectedNetwork) return;

    if (selectedNetwork.id === "csv-upload") {
      if (file) {
        if (onNetworkConnected) {
          onNetworkConnected(selectedNetwork.id, "CSV Upload");
        }
        onOpenChange(false);
      }
    } else {
      if (apiKey) {
        if (onNetworkConnected) {
          onNetworkConnected(selectedNetwork.id, selectedNetwork.name);
        }
        onOpenChange(false);
      }
    }
    // Reset state after saving
    setSelectedNetwork(null);
  };

  const handleBack = () => {
    setSelectedNetwork(null);
  };

  const handleCsvClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {selectedNetwork ? `Connect ${selectedNetwork.name}` : "Add New Network"}
          </DialogTitle>
        </DialogHeader>

        {!selectedNetwork ? (
          <ScrollArea className="h-72">
            <div className="grid gap-4 py-4">
              {affiliateNetworks.map((network) => (
                <div
                  key={network.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted"
                  onClick={() => handleConnect(network)}
                >
                  <div className="flex items-center space-x-3">
                    <network.icon className="h-5 w-5 text-primary" />
                    <span className="font-medium">{network.name}</span>
                  </div>
                  <Badge>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Badge>
                </div>
              ))}
              <div
                className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted"
                onClick={() => handleConnect({ id: "csv-upload", name: "CSV Upload", icon: Upload })}
              >
                <div className="flex items-center space-x-3">
                  <Upload className="h-5 w-5 text-primary" />
                  <span className="font-medium">CSV Upload</span>
                </div>
                <Badge>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Badge>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="space-y-4 py-4">
            {selectedNetwork.id === "csv-upload" ? (
              <div className="space-y-2">
                <Label>Upload CSV</Label>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={handleCsvClick}>
                    <Upload className="h-4 w-4 mr-2" /> Select File
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {file ? file.name : "No file selected"}
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv"
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key *</Label>
                  <Input
                    id="api-key"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="affiliate-id">Affiliate ID (Optional)</Label>
                  <Input
                    id="affiliate-id"
                    placeholder="Enter your affiliate ID"
                    value={affiliateId}
                    onChange={(e) => setAffiliateId(e.target.value)}
                  />
                </div>
              </>
            )}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleSaveConnection} disabled={!apiKey && !file}>
                Connect
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}