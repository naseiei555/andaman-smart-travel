import type { AndamanProvince } from './images.data';
import { provinceShowcaseImages } from './images.data';

export interface AndamanVideo {
  readonly id: string;
  readonly province: AndamanProvince;
  readonly title: string;
  readonly description: string;
  readonly youtubeId: string;
  readonly channel: string;
  readonly thumbnail: string;
  readonly sourceUrl: string;
  readonly fallbackUrl: string;
}

const video = (
  id: string,
  province: AndamanProvince,
  title: string,
  description: string,
  youtubeId: string,
  channel: string,
): AndamanVideo => ({
  id,
  province,
  title,
  description,
  youtubeId,
  channel,
  thumbnail: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
  sourceUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
  fallbackUrl: provinceShowcaseImages[province].fallbackUrl,
});

export const andamanVideos: readonly AndamanVideo[] = [
  // VIDEO: Phuket — แก้ title, description, youtubeId และ channel ในรายการนี้
  video(
    'phuket-aerial',
    'Phuket',
    'Phuket, Thailand 4K HDR ULTRA HD 60 FPS Dolby vision™ Aerial Video',
    'Aerial views of Phuket, Thailand, filmed in high dynamic range.',
    '9e9XnPQsh4w',
    'Go Went Go',
  ),
  // VIDEO: Phang Nga — แก้ title, description, youtubeId และ channel ในรายการนี้
  video(
    'phang-nga-bay',
    'Phang Nga',
    'Phang Nga Bay, Thailand [Amazing Places 4K]',
    'A 4K look at Phang Nga Bay and its distinctive limestone islands.',
    'lPVGA1FrF5c',
    'Go Went Go',
  ),
  // VIDEO: Krabi — แก้ title, description, youtubeId และ channel ในรายการนี้
  video(
    'railay-krabi',
    'Krabi',
    'Railay Beach - Thailand | Cinematic Drone Video 4K',
    'A cinematic aerial view of Railay Beach in Krabi province.',
    'Z8rU_-oiopM',
    'Go Went Go',
  ),
  // VIDEO: Trang — แก้ title, description, youtubeId และ channel ในรายการนี้
  video(
    'koh-kradan',
    'Trang',
    'ทะเลตรัง นอนเกาะกระดาน และหาดที่สวยระดับโลก | VLOG',
    'พาเที่ยวทะเลตรังและเกาะกระดาน พร้อมชมบรรยากาศชายหาดและเกาะในจังหวัดตรัง',
    'J7i5YFGPkhI',
    'Go Went Go',
  ),
  // VIDEO: Satun — แก้ title, description, youtubeId และ channel ในรายการนี้
  video(
    'koh-lipe',
    'Satun',
    'Koh Lipe Island Clearest Water in Thailand - Paradise on Earth Drone 4K',
    'A 4K aerial look at Koh Lipe, its coastline and clear water in Satun.',
    'lTuUqoVXIg4',
    'Go Went Go',
  ),

     video(
    'songkhla',
    'Songkhla',
    'Songkhla, Thailand - 4K Aerial Drone Video',
    'A 4K aerial view of Songkhla and its beaches.',
    '9wtPMrvj7Pw',
    'Go Went Go',
  ),

    video(
    'suratThani',
    'Surat Thani',
    'Surat Thani, Thailand - 4K Aerial Drone Video',
    'A 4K aerial view of Surat Thani and its beaches.',
    'G-RP1lat_Z8',
    'Go Went Go',
  ),

    video(
    'narathiwat',
    'Narathiwat',
    'Narathiwat, Thailand - 4K Aerial Drone Video',
    'A 4K aerial view of Narathiwat and its beaches.',
    'D5oBkBENHWU',
    'Go Went Go',
  ),
  
    video(
    'yala',
    'Yala',
    'Yala, Thailand - 4K Aerial Drone Video',
    'A 4K aerial view of Yala and its beaches.',
    'gQU1Ya7ZaWg',
    'Go Went Go',
  ),

    video(
    'pattani',
    'Pattani',
    'Pattani, Thailand - 4K Aerial Drone Video',
    'A 4K aerial view of Pattani and its beaches.',
    'KBnGEULC1dg',
    'Go Went Go',
  ),

    video(
    'phatthalung',
    'Phatthalung',
    'Phatthalung, Thailand - 4K Aerial Drone Video',
    'A 4K aerial view of Phatthalung and its beaches.',
    'WoD_YsMAZ6k',
    'Go Went Go',
  ),

    video(
    'nakhon-si-thammarat',
    'Nakhon Si Thammarat',
    'Nakhon Si Thammarat, Thailand - 4K Aerial Drone Video',
    'A 4K aerial view of Nakhon Si Thammarat and its beaches.',
    'ORNmjwjXuyo',
    'Go Went Go',
  ),

    video(
    'chumphon',
    'Chumphon',
    'Chumphon, Thailand - 4K Aerial Drone Video',
    'A 4K aerial view of Chumphon and its beaches.',
    'SVdrPM-K7-Q',
    'Go Went Go',
  ),

    video(
    'ranong',
    'Ranong',
    'Ranong, Thailand - 4K Aerial Drone Video',
    'A 4K aerial view of Ranong and its beaches.',
    'Jc9MhsVuePA',
    'Go Went Go',
  ),
];

export function youtubeEmbedUrl(video: AndamanVideo): string {
  return `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`;
}
