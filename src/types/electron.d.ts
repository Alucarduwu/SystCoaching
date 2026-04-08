export {};

declare global {
  interface Window {
    electronAPI: {
      ping: () => Promise<{
        ok: boolean;
        message: string;
        appPath: string;
        userDataPath: string;
      }>;

      getPaths: () => Promise<{
        userData: string;
        documents: string;
        desktop: string;
        downloads: string;
      }>;

      saveTextFile: (payload: {
        fileName: string;
        content: string;
      }) => Promise<{
        ok: boolean;
        canceled?: boolean;
        path?: string;
        error?: string;
      }>;

      readTextFile: () => Promise<{
        ok: boolean;
        canceled?: boolean;
        path?: string;
        content?: string;
        error?: string;
      }>;

      initDatabase: () => Promise<{
        ok: boolean;
        message: string;
        dbPath?: string;
      }>;

      testDatabase: () => Promise<{
        ok: boolean;
        message: string;
      }>;

      patients: {
        getAll: () => Promise<{
          ok: boolean;
          data?: any[];
          error?: string;
        }>;

        getById: (id: number) => Promise<{
          ok: boolean;
          data?: any;
          error?: string;
        }>;

        create: (payload: any) => Promise<{
          ok: boolean;
          data?: any;
          error?: string;
        }>;

        update: (payload: any) => Promise<{
          ok: boolean;
          data?: any;
          error?: string;
        }>;

        delete: (id: number) => Promise<{
          ok: boolean;
          deletedId?: number;
          error?: string;
        }>;

        getProfile: (id: number) => Promise<{
          ok: boolean;
          data?: any;
          error?: string;
        }>;
      };

      measurements: {
        create: (payload: any) => Promise<{
          ok: boolean;
          data?: any;
          error?: string;
        }>;

        update: (payload: any) => Promise<{
          ok: boolean;
          data?: any;
          error?: string;
        }>;

        getByPatient: (patientId: number) => Promise<{
          ok: boolean;
          data?: any[];
          error?: string;
        }>;

        delete: (measurementId: number) => Promise<{
          ok: boolean;
          data?: any;
          error?: string;
        }>;
      };

      exercises: {
        getAll: () => Promise<{ ok: boolean; data?: any[]; error?: string }>;
        getById: (id: number) => Promise<{ ok: boolean; data?: any; error?: string }>;
        create: (payload: any) => Promise<{ ok: boolean; data?: any; error?: string }>;
        update: (payload: any) => Promise<{ ok: boolean; data?: any; error?: string }>;
        delete: (id: number) => Promise<{ ok: boolean; data?: any; error?: string }>;
      };

      measurementPhotos: {
        create: (payload: {
          measurement_id: number;
          fecha?: string | null;
          nota?: string | null;
          file: {
            name: string;
            type: string;
            buffer: number[];
          };
        }) => Promise<{
          ok: boolean;
          data?: any;
          error?: string;
        }>;

        getByMeasurement: (measurementId: number) => Promise<{
          ok: boolean;
          data?: any[];
          error?: string;
        }>;

        delete: (photoId: number) => Promise<{
          ok: boolean;
          data?: any;
          error?: string;
        }>;
      };

      foods: {
        getAll: () => Promise<{
          ok: boolean;
          data?: any[];
          error?: string;
        }>;

        getById: (id: number) => Promise<{
          ok: boolean;
          data?: any;
          error?: string;
        }>;

        create: (payload: any) => Promise<{
          ok: boolean;
          data?: any;
          error?: string;
        }>;

        update: (payload: any) => Promise<{
          ok: boolean;
          data?: any;
          error?: string;
        }>;

        delete: (id: number) => Promise<{
          ok: boolean;
          data?: any;
          error?: string;
        }>;
      };
    };
  }
}