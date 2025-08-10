export interface LoraCreator {
    username: string;
}

export interface LoraFile {
    name: string;
    downloadUrl: string;
}

export interface ImageMeta {
    prompt?: string;
    negativePrompt?: string;
    cfgScale?: number;
    steps?: number;
    sampler?: string;
    seed?: number;
    clipSkip?: number;
    resources?: Array<{
        name: string;
        type: string;
        weight?: number;
        hash?: string;
    }>;
    [key: string]: any;
}

export interface LoraImage {
    url: string;
    width: number;
    height: number;
    hash?: string;
    meta?: ImageMeta;
    nsfw?: boolean;
    nsfwLevel?: number;
}

export interface LoraModelVersion {
    id: number;
    name: string;
    createdAt: string;
    files: LoraFile[];
    images: LoraImage[];
    trainedWords?: string[];
    description?: string;
}

export interface LoraModel {
    id: number;
    name: string;
    description: string | null;
    creator: LoraCreator;
    modelVersions: LoraModelVersion[];
    tags?: string[];
    type?: string;
    // 用户备注功能
    note?: string;
    noteTimestamp?: number;
}
