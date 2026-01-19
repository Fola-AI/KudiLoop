import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

async function uploadToCloudinary(uri: string): Promise<string> {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "kudiloop_partners";

  if (!cloudName) {
    throw new Error("Cloudinary cloud name is not configured");
  }

  const formData = new FormData();
  formData.append(
    "file",
    {
      uri,
      type: "image/jpeg",
      name: "partner-logo.jpg",
    } as any,
  );
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "partners");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok || data?.error) {
    throw new Error(data?.error?.message || "Failed to upload image");
  }

  return data.secure_url;
}

// Fetch all partners
export function usePartners() {
  return useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const response = await api.get("/partners");
      return response.data;
    },
  });
}

// Fetch single partner
export function usePartner(id: string) {
  return useQuery({
    queryKey: ["partners", id],
    queryFn: async () => {
      const response = await api.get(`/partners/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Track partner click
export function useTrackPartnerClick() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partnerId: string) => {
      const response = await api.post(`/partners/${partnerId}/click`);
      return response.data;
    },
    onSuccess: () => {
      // Optionally refetch partners to update click counts
      queryClient.invalidateQueries({ queryKey: ["partners"] });
    },
  });
}

// Create partner (admin only)
export function useCreatePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      category: string;
      affiliateLink: string;
      commissionRate?: string | null;
      color?: string;
      isActive?: number;
      logoUri?: string | null;
      bannerUri?: string | null;
    }) => {
      let logoUrl: string | null = null;
      let bannerUrl: string | null = null;

      if (data.logoUri) {
        logoUrl = await uploadToCloudinary(data.logoUri);
      }
      if (data.bannerUri) {
        bannerUrl = await uploadToCloudinary(data.bannerUri);
      }

      const response = await api.post("/partners", {
        name: data.name,
        description: data.description,
        category: data.category,
        affiliateLink: data.affiliateLink,
        commissionRate: data.commissionRate,
        color: data.color,
        isActive: data.isActive ?? 1,
        logoUrl,
        bannerUrl,
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
    },
  });
}

// Update partner (admin only)
export function useUpdatePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      description: string;
      category: string;
      affiliateLink: string;
      commissionRate?: string | null;
      color?: string;
      isActive?: number;
      logoUri?: string | null;
      bannerUri?: string | null;
      logoRemoved?: boolean;
    }) => {
      let logoUrl: string | null | undefined = undefined;
      let bannerUrl: string | null | undefined = undefined;

      if (data.logoUri) {
        logoUrl = await uploadToCloudinary(data.logoUri);
      } else if (data.logoRemoved) {
        logoUrl = null;
      }
      if (data.bannerUri) {
        bannerUrl = await uploadToCloudinary(data.bannerUri);
      }

      const payload: Record<string, unknown> = {
        name: data.name,
        description: data.description,
        category: data.category,
        affiliateLink: data.affiliateLink,
        commissionRate: data.commissionRate,
        color: data.color,
        isActive: data.isActive ?? 1,
      };

      if (logoUrl !== undefined) {
        payload.logoUrl = logoUrl;
      }
      if (bannerUrl !== undefined) {
        payload.bannerUrl = bannerUrl;
      }

      const response = await api.patch(`/partners/${data.id}`, payload);
      return response.data;
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      queryClient.invalidateQueries({ queryKey: ["partners", variables.id] });
    },
  });
}

// Delete partner (admin only)
export function useDeletePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partnerId: string) => {
      const response = await api.delete(`/partners/${partnerId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
    },
  });
}

// Get partners analytics (admin only)
export function usePartnersAnalytics() {
  return useQuery({
    queryKey: ["partners", "analytics"],
    queryFn: async () => {
      const response = await api.get("/partners/analytics");
      return response.data;
    },
  });
}

