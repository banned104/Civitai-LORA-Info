export interface LoraCreator {
    username: string;
}

export interface LoraFile {
    name: string;
    downloadUrl: string;
}

export interface LoraImage {
    url: string;
    width: number;
    height: number;
}

export interface LoraModelVersion {
    name: string;
    createdAt: string;
    files: LoraFile[];
    images: LoraImage[];
}

export interface LoraModel {
    id: number;
    name: string;
    description: string | null;
    creator: LoraCreator;
    modelVersions: LoraModelVersion[];
}
