import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
// import { BadRequestException } from '@nestjs/common';
// import { Op } from 'sequelize';
import { ArticlesService } from './articles.service';
import { Article } from './article.entity';
import axios, { AxiosInstance } from 'axios';
import { BadRequestException } from '@nestjs/common';
import { Op } from 'sequelize';

jest.mock('axios');

describe('ArticleService - findArticlesPaginated', () => {
  let service: ArticlesService;
  let articleModelMock: any;

  beforeEach(async () => {
    articleModelMock = {
      findAndCountAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: getModelToken(Article),
          useValue: articleModelMock,
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
  });

  it('should throw BadRequestException for invalid sort field', async () => {
    await expect(
      service.findArticlesPaginated(
        1,
        10,
        undefined,
        'invalidField' as any,
        'ASC',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should use default pagination and return results', async () => {
    const mockRows = [
      { id: 1, title: 'Article 1', publication_date: new Date() },
      { id: 2, title: 'Article 2', publication_date: new Date() },
    ];

    articleModelMock.findAndCountAll.mockResolvedValueOnce({
      count: 2,
      rows: mockRows,
    });

    const result = await service.findArticlesPaginated();

    expect(articleModelMock.findAndCountAll).toHaveBeenCalledWith({
      where: {},
      order: [['publication_date', 'DESC']],
      limit: 10,
      offset: 0,
    });

    expect(result).toEqual({
      data: mockRows,
      total: 2,
      page: 1,
      pageSize: 10,
      hasNextPage: false,
    });
  });

  it('should apply date filtering correctly', async () => {
    const mockRows = [
      { id: 1, title: 'Recent Article', publication_date: new Date() },
    ];

    const days = 7;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    articleModelMock.findAndCountAll.mockResolvedValueOnce({
      count: 1,
      rows: mockRows,
    });

    const result = await service.findArticlesPaginated(1, 10, days);

    expect(articleModelMock.findAndCountAll).toHaveBeenCalledWith({
      where: {
        publication_date: {
          [Op.gte]: daysAgo,
        },
      },
      order: [['publication_date', 'DESC']],
      limit: 10,
      offset: 0,
    });

    expect(result).toEqual({
      data: mockRows,
      total: 1,
      page: 1,
      pageSize: 10,
      hasNextPage: false,
    });
  });

  it('should handle custom page, pageSize, sortBy, and order', async () => {
    const mockRows = [
      { id: 3, title: 'Another Article', publication_date: new Date() },
    ];

    articleModelMock.findAndCountAll.mockResolvedValueOnce({
      count: 1,
      rows: mockRows,
    });

    const result = await service.findArticlesPaginated(
      2,
      5,
      undefined,
      'id',
      'ASC',
    );

    expect(articleModelMock.findAndCountAll).toHaveBeenCalledWith({
      where: {},
      order: [['id', 'ASC']],
      limit: 5,
      offset: 5, // Offset = (page - 1) * pageSize
    });

    expect(result).toEqual({
      data: mockRows,
      total: 1,
      page: 2,
      pageSize: 5,
      hasNextPage: false,
    });
  });
});

describe('ArticlesService - scrapeHackerNews', () => {
  let service: ArticlesService;
  let articleModelMock: any;
  let mockedAxios: jest.Mocked<AxiosInstance>;

  beforeEach(async () => {
    // Reset mocks before each test
    jest.resetAllMocks();

    // Create mock for Axios
    mockedAxios = axios as unknown as jest.Mocked<AxiosInstance>;

    // Create mock for Article Model
    articleModelMock = {
      bulkCreate: jest
        .fn()
        .mockImplementation((articles) => Promise.resolve(articles)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: getModelToken(Article),
          useValue: articleModelMock,
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
  });

  afterEach(() => {
    // Restore the Date mock to its original implementation
    jest.spyOn(global, 'Date').mockRestore();
  });

  it('should scrape multiple pages of articles', async () => {
    // Mock multiple page responses
    const mockResponses = [
      {
        data: `
         <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Hacker News</title>
  </head>
  <body>
    <table>
      <tr class="athing submission" id="42428950">
        <td align="right" valign="top" class="title"><span class="rank">61.</span></td>
        <td valign="top" class="votelinks">
          <center>
            <a id="up_42428950" href="vote?id=42428950&amp;how=up&amp;goto=front%3Fday%3D2024-12-16%26p%3D3">
              <div class="votearrow" title="upvote"></div>
            </a>
          </center>
        </td>
        <td class="title">
          <span class="titleline">
            <a href="https://example.com/article1" rel="nofollow">Test Article 1</a>
            <span class="sitebit comhead"> (<a href="from?site=example.com"><span class="sitestr">example.com</span></a>)</span>
          </span>
        </td>
      </tr>
    </table>
  </body>
  </html>
      `,
      },
      {
        data: `
        <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Hacker News</title>
  </head>
  <body>
    <table>
      <tr class="athing submission" id="42428950">
        <td align="right" valign="top" class="title"><span class="rank">61.</span></td>
        <td valign="top" class="votelinks">
          <center>
            <a id="up_42428950" href="vote?id=42428950&amp;how=up&amp;goto=front%3Fday%3D2024-12-16%26p%3D3">
              <div class="votearrow" title="upvote"></div>
            </a>
          </center>
        </td>
        <td class="title">
          <span class="titleline">
            <a href="https://example.com/article2" rel="nofollow">Test Article 2</a>
            <span class="sitebit comhead"> (<a href="from?site=example.com"><span class="sitestr">example.com</span></a>)</span>
          </span>
        </td>
      </tr>
    </table>
  </body>
  </html>
      `,
      },
      {
        data: `
        <html>
          <body>
            <!-- Empty page to simulate end of articles -->
          </body>
        </html>
      `,
      },
    ];

    // Create a mock implementation that tracks calls
    mockedAxios.get.mockImplementation(async (url) => {
      // Extract page number from URL
      const pageMatch = url.match(/p=(\d+)/);
      const pageNumber = pageMatch ? parseInt(pageMatch[1], 10) : 1;
      // Return corresponding mock response or empty page if out of bounds
      if (pageNumber <= mockResponses.length) {
        return mockResponses[pageNumber - 1];
      }

      // Return an empty page to simulate no more articles
      return { data: '<html><body></body></html>' };
    });

    const testDate = new Date('2024-06-15');
    const expectedArticles = [
      {
        title: 'Test Article 1',
        url: 'https://example.com/article1',
        source: 'example.com',
        publication_date: testDate,
      },
      {
        title: 'Test Article 2',
        url: 'https://example.com/article2',
        source: 'example.com',
        publication_date: testDate,
      },
    ];

    // Mock date to ensure consistent testing
    jest.spyOn(global, 'Date').mockImplementation(() => testDate as any);

    const result = await service.scrapeHackerNews('2024-06-15');

    // Verify axios calls
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining(
        'https://news.ycombinator.com/front?day=2024-06-15&p=1',
      ),
      expect.objectContaining({
        headers: expect.any(Object),
        timeout: 10000,
      }),
    );

    // Verify article model creation
    expect(articleModelMock.bulkCreate).toHaveBeenCalledWith(expectedArticles, {
      ignoreDuplicates: true,
    });

    // Verify result
    expect(result).toEqual(expectedArticles);
  });

  it('should handle invalid date filter', async () => {
    jest.restoreAllMocks();
    const futureDate = new Date();
    console.log('Future Date:', futureDate);
    console.log('Type:', typeof futureDate);
    futureDate.setDate(futureDate.getDate() + 1);

    // Mock empty response for invalid date
    mockedAxios.get.mockResolvedValue({
      data: `
        <html>
          <body>
            <!-- Empty page to simulate end of articles -->
          </body>
        </html>
      `,
    });

    const result = await service.scrapeHackerNews(
      futureDate.toISOString().split('T')[0],
    );

    // Should result in an empty array
    expect(result).toHaveLength(0);
  });

  it('should handle scraping errors', async () => {
    // Simulate network error
    mockedAxios.get.mockRejectedValue(new Error('Network Error'));

    // Expect the method to throw a specific error
    await expect(service.scrapeHackerNews('2024-06-15')).rejects.toThrow(
      'Failed to scrape Hacker News: Network Error',
    );

    // Ensure no articles are created on error
    expect(articleModelMock.bulkCreate).not.toHaveBeenCalled();
  });

  it('should handle pages with no articles', async () => {
    // Mock an empty page response
    mockedAxios.get.mockResolvedValue({
      data: `
        <html>
          <body>
            <!-- No articles on this page -->
          </body>
        </html>
      `,
    });

    const result = await service.scrapeHackerNews();

    // Expect an empty array
    expect(result).toHaveLength(0);

    // Verify axios was called
    expect(mockedAxios.get).toHaveBeenCalled();
  });
});
