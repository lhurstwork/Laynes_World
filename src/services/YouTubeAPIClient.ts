import type { YouTubeVideo } from '../types';
import { VideoType } from '../types';
import { config } from '../config/environment';

/**
 * YouTube API Client for fetching video data
 * Uses mock data for development to avoid API rate limits
 */
export class YouTubeAPIClient {
  private useMockData: boolean;

  constructor(_apiKey?: string, useMockData?: boolean) {
    // Store for future use when real API is implemented
    // this._apiKey = apiKey || config.youtubeApiKey;
    // this._baseUrl = config.youtubeApiUrl;
    this.useMockData = useMockData !== undefined ? useMockData : config.useMockData;
  }

  /**
   * Fetches new releases from subscribed channels
   */
  async fetchNewReleases(): Promise<YouTubeVideo[]> {
    if (this.useMockData) {
      return this.getMockNewReleases();
    }

    // Real API implementation would go here
    // const response = await this.apiClient.get<YouTubeAPIResponse>('/videos', {
    //   headers: { 'Authorization': `Bearer ${apiKey}` }
    // });
    // return this.transformAPIResponse(response, VideoType.NEW_RELEASE);

    throw new Error('Real YouTube API not implemented');
  }

  /**
   * Fetches recommended videos based on user preferences
   */
  async fetchRecommended(): Promise<YouTubeVideo[]> {
    if (this.useMockData) {
      return this.getMockRecommended();
    }

    // Real API implementation would go here
    throw new Error('Real YouTube API not implemented');
  }

  /**
   * Mock data for new releases
   */
  private getMockNewReleases(): YouTubeVideo[] {
    return [
      {
        id: 'dQw4w9WgXcQ',
        title: 'Building Scalable Web Applications with React',
        channelName: 'Tech Tutorials',
        channelId: 'UC_channel_1',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        uploadDate: new Date('2024-02-10T10:00:00Z'),
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        type: VideoType.NEW_RELEASE
      },
      {
        id: 'jNQXAC9IVRw',
        title: 'TypeScript Advanced Patterns',
        channelName: 'Code Masters',
        channelId: 'UC_channel_2',
        thumbnail: 'https://i.ytimg.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
        uploadDate: new Date('2024-02-11T14:30:00Z'),
        url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        type: VideoType.NEW_RELEASE
      },
      {
        id: 'M7lc1UVf-VE',
        title: 'Modern CSS Grid Layouts',
        channelName: 'Design Weekly',
        channelId: 'UC_channel_3',
        thumbnail: 'https://i.ytimg.com/vi/M7lc1UVf-VE/maxresdefault.jpg',
        uploadDate: new Date('2024-02-12T08:15:00Z'),
        url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
        type: VideoType.NEW_RELEASE
      },
      {
        id: 'yWfZnjkhhhg',
        title: 'API Design Best Practices',
        channelName: 'Backend Bytes',
        channelId: 'UC_channel_4',
        thumbnail: 'https://i.ytimg.com/vi/yWfZnjkhhhg/maxresdefault.jpg',
        uploadDate: new Date('2024-02-11T16:45:00Z'),
        url: 'https://www.youtube.com/watch?v=yWfZnjkhhhg',
        type: VideoType.NEW_RELEASE
      }
    ];
  }

  /**
   * Mock data for recommended videos
   */
  private getMockRecommended(): YouTubeVideo[] {
    return [
      {
        id: 'kJQP7kiw5Fk',
        title: 'Introduction to Machine Learning',
        channelName: 'AI Academy',
        channelId: 'UC_channel_5',
        thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg',
        uploadDate: new Date('2024-02-08T12:00:00Z'),
        url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
        type: VideoType.RECOMMENDED
      },
      {
        id: 'L_LUpnjgPso',
        title: 'Docker for Beginners',
        channelName: 'DevOps Daily',
        channelId: 'UC_channel_6',
        thumbnail: 'https://i.ytimg.com/vi/L_LUpnjgPso/maxresdefault.jpg',
        uploadDate: new Date('2024-02-05T09:30:00Z'),
        url: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
        type: VideoType.RECOMMENDED
      },
      {
        id: 'fJ9rUzIMcZQ',
        title: 'GraphQL vs REST APIs',
        channelName: 'API Insights',
        channelId: 'UC_channel_7',
        thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg',
        uploadDate: new Date('2024-02-07T15:20:00Z'),
        url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
        type: VideoType.RECOMMENDED
      },
      {
        id: 'QH2-TGUlwu4',
        title: 'Performance Optimization Techniques',
        channelName: 'Web Performance',
        channelId: 'UC_channel_8',
        thumbnail: 'https://i.ytimg.com/vi/QH2-TGUlwu4/maxresdefault.jpg',
        uploadDate: new Date('2024-02-06T11:00:00Z'),
        url: 'https://www.youtube.com/watch?v=QH2-TGUlwu4',
        type: VideoType.RECOMMENDED
      },
      {
        id: 'nfmcxhGjOmU',
        title: 'Testing Strategies for Modern Apps',
        channelName: 'Quality Code',
        channelId: 'UC_channel_9',
        thumbnail: 'https://i.ytimg.com/vi/nfmcxhGjOmU/maxresdefault.jpg',
        uploadDate: new Date('2024-02-09T13:45:00Z'),
        url: 'https://www.youtube.com/watch?v=nfmcxhGjOmU',
        type: VideoType.RECOMMENDED
      }
    ];
  }
}
