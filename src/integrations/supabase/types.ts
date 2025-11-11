export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      anggota_keluarga: {
        Row: {
          created_at: string
          hubungan_keluarga: string
          id: string
          keluarga_id: string
          warga_id: string
        }
        Insert: {
          created_at?: string
          hubungan_keluarga: string
          id?: string
          keluarga_id: string
          warga_id: string
        }
        Update: {
          created_at?: string
          hubungan_keluarga?: string
          id?: string
          keluarga_id?: string
          warga_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anggota_keluarga_keluarga_id_fkey"
            columns: ["keluarga_id"]
            isOneToOne: false
            referencedRelation: "keluarga"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anggota_keluarga_warga_id_fkey"
            columns: ["warga_id"]
            isOneToOne: false
            referencedRelation: "warga"
            referencedColumns: ["id"]
          },
        ]
      }
      keluarga: {
        Row: {
          alamat: string
          created_at: string
          id: string
          jumlah_anggota: number
          kepala_keluarga_id: string
          nomor_kk: string
          rt: string
          rw: string
          updated_at: string
        }
        Insert: {
          alamat: string
          created_at?: string
          id?: string
          jumlah_anggota?: number
          kepala_keluarga_id: string
          nomor_kk: string
          rt: string
          rw?: string
          updated_at?: string
        }
        Update: {
          alamat?: string
          created_at?: string
          id?: string
          jumlah_anggota?: number
          kepala_keluarga_id?: string
          nomor_kk?: string
          rt?: string
          rw?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "keluarga_kepala_keluarga_id_fkey"
            columns: ["kepala_keluarga_id"]
            isOneToOne: false
            referencedRelation: "warga"
            referencedColumns: ["id"]
          },
        ]
      }
      laporan_kelahiran: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          jenis_kelamin: Database["public"]["Enums"]["gender_type"]
          keterangan: string | null
          nama_ayah: string
          nama_bayi: string
          nama_ibu: string
          nik_bayi: string | null
          tanggal_lahir: string
          tempat_lahir: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          jenis_kelamin: Database["public"]["Enums"]["gender_type"]
          keterangan?: string | null
          nama_ayah: string
          nama_bayi: string
          nama_ibu: string
          nik_bayi?: string | null
          tanggal_lahir: string
          tempat_lahir: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          jenis_kelamin?: Database["public"]["Enums"]["gender_type"]
          keterangan?: string | null
          nama_ayah?: string
          nama_bayi?: string
          nama_ibu?: string
          nik_bayi?: string | null
          tanggal_lahir?: string
          tempat_lahir?: string
        }
        Relationships: []
      }
      laporan_kematian: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          keterangan: string | null
          nama_almarhum: string
          nik: string | null
          sebab_kematian: string | null
          tanggal_meninggal: string
          tempat_meninggal: string
          warga_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          keterangan?: string | null
          nama_almarhum: string
          nik?: string | null
          sebab_kematian?: string | null
          tanggal_meninggal: string
          tempat_meninggal: string
          warga_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          keterangan?: string | null
          nama_almarhum?: string
          nik?: string | null
          sebab_kematian?: string | null
          tanggal_meninggal?: string
          tempat_meninggal?: string
          warga_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "laporan_kematian_warga_id_fkey"
            columns: ["warga_id"]
            isOneToOne: false
            referencedRelation: "warga"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      warga: {
        Row: {
          agama: Database["public"]["Enums"]["religion_type"]
          alamat: string
          created_at: string
          created_by: string | null
          id: string
          jenis_kelamin: Database["public"]["Enums"]["gender_type"]
          kewarganegaraan: string
          nama: string
          nik: string
          pekerjaan: string | null
          pendidikan: string | null
          rt: string
          rw: string
          status_perkawinan: Database["public"]["Enums"]["marital_status"]
          tanggal_lahir: string
          tempat_lahir: string
          updated_at: string
        }
        Insert: {
          agama: Database["public"]["Enums"]["religion_type"]
          alamat: string
          created_at?: string
          created_by?: string | null
          id?: string
          jenis_kelamin: Database["public"]["Enums"]["gender_type"]
          kewarganegaraan?: string
          nama: string
          nik: string
          pekerjaan?: string | null
          pendidikan?: string | null
          rt: string
          rw?: string
          status_perkawinan: Database["public"]["Enums"]["marital_status"]
          tanggal_lahir: string
          tempat_lahir: string
          updated_at?: string
        }
        Update: {
          agama?: Database["public"]["Enums"]["religion_type"]
          alamat?: string
          created_at?: string
          created_by?: string | null
          id?: string
          jenis_kelamin?: Database["public"]["Enums"]["gender_type"]
          kewarganegaraan?: string
          nama?: string
          nik?: string
          pekerjaan?: string | null
          pendidikan?: string | null
          rt?: string
          rw?: string
          status_perkawinan?: Database["public"]["Enums"]["marital_status"]
          tanggal_lahir?: string
          tempat_lahir?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      gender_type: "Laki-laki" | "Perempuan"
      marital_status: "Belum Kawin" | "Kawin" | "Cerai Hidup" | "Cerai Mati"
      religion_type:
        | "Islam"
        | "Kristen"
        | "Katolik"
        | "Hindu"
        | "Buddha"
        | "Konghucu"
      user_role: "admin_rw" | "admin_rt" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      gender_type: ["Laki-laki", "Perempuan"],
      marital_status: ["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"],
      religion_type: [
        "Islam",
        "Kristen",
        "Katolik",
        "Hindu",
        "Buddha",
        "Konghucu",
      ],
      user_role: ["admin_rw", "admin_rt", "user"],
    },
  },
} as const
