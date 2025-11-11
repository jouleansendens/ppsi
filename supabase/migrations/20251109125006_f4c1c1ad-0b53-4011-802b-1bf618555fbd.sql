-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin_rw', 'admin_rt', 'user');

-- Create enum for gender
CREATE TYPE public.gender_type AS ENUM ('Laki-laki', 'Perempuan');

-- Create enum for marital status
CREATE TYPE public.marital_status AS ENUM ('Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati');

-- Create enum for religion
CREATE TYPE public.religion_type AS ENUM ('Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create warga (citizens) table
CREATE TABLE public.warga (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nik VARCHAR(16) UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  tempat_lahir TEXT NOT NULL,
  tanggal_lahir DATE NOT NULL,
  jenis_kelamin gender_type NOT NULL,
  alamat TEXT NOT NULL,
  rt VARCHAR(3) NOT NULL,
  rw VARCHAR(3) DEFAULT '08' NOT NULL,
  agama religion_type NOT NULL,
  status_perkawinan marital_status NOT NULL,
  pekerjaan TEXT,
  pendidikan TEXT,
  kewarganegaraan VARCHAR(50) DEFAULT 'Indonesia' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Create keluarga (family) table
CREATE TABLE public.keluarga (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_kk VARCHAR(16) UNIQUE NOT NULL,
  kepala_keluarga_id UUID REFERENCES public.warga(id) ON DELETE CASCADE NOT NULL,
  alamat TEXT NOT NULL,
  rt VARCHAR(3) NOT NULL,
  rw VARCHAR(3) DEFAULT '08' NOT NULL,
  jumlah_anggota INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create anggota_keluarga (family members) table
CREATE TABLE public.anggota_keluarga (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keluarga_id UUID REFERENCES public.keluarga(id) ON DELETE CASCADE NOT NULL,
  warga_id UUID REFERENCES public.warga(id) ON DELETE CASCADE NOT NULL,
  hubungan_keluarga TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(keluarga_id, warga_id)
);

-- Create laporan_kelahiran (birth reports) table
CREATE TABLE public.laporan_kelahiran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_bayi TEXT NOT NULL,
  nik_bayi VARCHAR(16),
  tanggal_lahir DATE NOT NULL,
  tempat_lahir TEXT NOT NULL,
  jenis_kelamin gender_type NOT NULL,
  nama_ayah TEXT NOT NULL,
  nama_ibu TEXT NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Create laporan_kematian (death reports) table
CREATE TABLE public.laporan_kematian (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warga_id UUID REFERENCES public.warga(id),
  nama_almarhum TEXT NOT NULL,
  nik VARCHAR(16),
  tanggal_meninggal DATE NOT NULL,
  tempat_meninggal TEXT NOT NULL,
  sebab_kematian TEXT,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keluarga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anggota_keluarga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan_kelahiran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan_kematian ENABLE ROW LEVEL SECURITY;

-- Create function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin_rw', 'admin_rt')
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for warga (authenticated users can CRUD)
CREATE POLICY "Authenticated users can view warga"
  ON public.warga FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert warga"
  ON public.warga FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update warga"
  ON public.warga FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete warga"
  ON public.warga FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for keluarga
CREATE POLICY "Authenticated users can view keluarga"
  ON public.keluarga FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert keluarga"
  ON public.keluarga FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update keluarga"
  ON public.keluarga FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete keluarga"
  ON public.keluarga FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for anggota_keluarga
CREATE POLICY "Authenticated users can view anggota_keluarga"
  ON public.anggota_keluarga FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert anggota_keluarga"
  ON public.anggota_keluarga FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update anggota_keluarga"
  ON public.anggota_keluarga FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete anggota_keluarga"
  ON public.anggota_keluarga FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for laporan_kelahiran
CREATE POLICY "Authenticated users can view laporan_kelahiran"
  ON public.laporan_kelahiran FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert laporan_kelahiran"
  ON public.laporan_kelahiran FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update laporan_kelahiran"
  ON public.laporan_kelahiran FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete laporan_kelahiran"
  ON public.laporan_kelahiran FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for laporan_kematian
CREATE POLICY "Authenticated users can view laporan_kematian"
  ON public.laporan_kematian FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert laporan_kematian"
  ON public.laporan_kematian FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update laporan_kematian"
  ON public.laporan_kematian FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete laporan_kematian"
  ON public.laporan_kematian FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_warga_updated_at
  BEFORE UPDATE ON public.warga
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_keluarga_updated_at
  BEFORE UPDATE ON public.keluarga
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, username)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  
  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();