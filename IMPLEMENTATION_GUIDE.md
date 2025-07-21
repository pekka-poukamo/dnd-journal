# D&D Journal App - Implementation Guide

## Project Setup & Structure

### Initial Project Initialization

```bash
# Frontend Setup (Next.js)
npx create-next-app@latest dnd-journal-frontend --typescript --tailwind --app
cd dnd-journal-frontend

# Install additional frontend dependencies
npm install @tanstack/react-query zustand @tiptap/react @tiptap/starter-kit
npm install @radix-ui/react-dialog @radix-ui/react-select lucide-react
npm install next-auth @auth/prisma-adapter
npm install @prisma/client prisma

# Backend Setup (Express.js)
mkdir dnd-journal-backend
cd dnd-journal-backend
npm init -y

# Install backend dependencies
npm install express cors helmet morgan compression
npm install prisma @prisma/client bcryptjs jsonwebtoken
npm install openai anthropic redis elasticsearch
npm install joi express-rate-limit multer aws-sdk
npm install --save-dev @types/node typescript ts-node nodemon
```

### Project Structure

```
dnd-journal-app/
├── frontend/                  # Next.js frontend
│   ├── src/
│   │   ├── app/              # Next.js 14 app router
│   │   │   ├── (auth)/       # Auth group routes
│   │   │   ├── dashboard/    # Main app routes
│   │   │   └── api/          # API routes (if needed)
│   │   ├── components/       # React components
│   │   │   ├── ui/           # Base UI components
│   │   │   ├── forms/        # Form components
│   │   │   ├── journal/      # Journal-specific components
│   │   │   └── ai/           # AI-related components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and configurations
│   │   ├── stores/           # Zustand stores
│   │   └── types/            # TypeScript type definitions
│   ├── prisma/               # Database schema
│   └── public/               # Static assets
├── backend/                  # Express.js backend
│   ├── src/
│   │   ├── controllers/      # Route controllers
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Custom middleware
│   │   ├── models/           # Database models
│   │   ├── routes/           # API routes
│   │   ├── utils/            # Utility functions
│   │   └── config/           # Configuration files
│   ├── prisma/               # Database schema (shared)
│   └── tests/                # Test files
└── shared/                   # Shared types and utilities
    ├── types/                # Shared TypeScript types
    └── schemas/              # Validation schemas
```

## Database Setup

### Prisma Schema Definition

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String           @id @default(cuid())
  email             String           @unique
  username          String           @unique
  passwordHash      String           @map("password_hash")
  subscriptionTier  SubscriptionTier @default(FREE) @map("subscription_tier")
  createdAt         DateTime         @default(now()) @map("created_at")
  updatedAt         DateTime         @updatedAt @map("updated_at")

  // Relationships
  campaigns         Campaign[]
  characters        Character[]
  journalEntries    JournalEntry[]
  aiPrompts         AIPrompt[]
  userPreferences   UserPreferences?

  @@map("users")
}

model Campaign {
  id          String   @id @default(cuid())
  name        String
  description String?
  dmUserId    String   @map("dm_user_id")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relationships
  dm             User           @relation(fields: [dmUserId], references: [id])
  characters     Character[]
  journalEntries JournalEntry[]
  tags           Tag[]

  @@map("campaigns")
}

model Character {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  campaignId        String  @map("campaign_id")
  name              String
  class             String
  race              String
  level             Int     @default(1)
  backstory         String?
  personalityTraits String? @map("personality_traits")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  // Relationships
  user           User           @relation(fields: [userId], references: [id])
  campaign       Campaign       @relation(fields: [campaignId], references: [id])
  journalEntries JournalEntry[]
  aiPrompts      AIPrompt[]

  @@map("characters")
}

model JournalEntry {
  id          String    @id @default(cuid())
  userId      String    @map("user_id")
  campaignId  String    @map("campaign_id")
  characterId String?   @map("character_id")
  title       String
  content     String    @db.Text
  entryType   EntryType @map("entry_type")
  sessionDate DateTime? @map("session_date")
  isPrivate   Boolean   @default(false) @map("is_private")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relationships
  user      User        @relation(fields: [userId], references: [id])
  campaign  Campaign    @relation(fields: [campaignId], references: [id])
  character Character?  @relation(fields: [characterId], references: [id])
  tags      EntryTag[]
  aiPrompts AIPrompt[]

  @@map("journal_entries")
}

model Tag {
  id         String @id @default(cuid())
  name       String
  color      String @default("#3B82F6")
  campaignId String @map("campaign_id")

  // Relationships
  campaign Campaign   @relation(fields: [campaignId], references: [id])
  entries  EntryTag[]

  @@unique([name, campaignId])
  @@map("tags")
}

model EntryTag {
  entryId String @map("entry_id")
  tagId   String @map("tag_id")

  // Relationships
  entry JournalEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)
  tag   Tag          @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([entryId, tagId])
  @@map("entry_tags")
}

model AIPrompt {
  id                String     @id @default(cuid())
  userId            String     @map("user_id")
  entryId           String?    @map("entry_id")
  characterId       String?    @map("character_id")
  promptType        PromptType @map("prompt_type")
  inputContext      String     @map("input_context") @db.Text
  generatedResponse String     @map("generated_response") @db.Text
  userFeedback      Json?      @map("user_feedback")
  effectivenessScore Float?    @map("effectiveness_score")
  createdAt         DateTime   @default(now()) @map("created_at")

  // Relationships
  user      User          @relation(fields: [userId], references: [id])
  entry     JournalEntry? @relation(fields: [entryId], references: [id])
  character Character?    @relation(fields: [characterId], references: [id])

  @@map("ai_prompts")
}

model UserPreferences {
  id            String   @id @default(cuid())
  userId        String   @unique @map("user_id")
  aiPreferences Json?    @map("ai_preferences")
  uiPreferences Json?    @map("ui_preferences")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relationships
  user User @relation(fields: [userId], references: [id])

  @@map("user_preferences")
}

enum SubscriptionTier {
  FREE
  PRO
  TEAM
}

enum EntryType {
  SESSION
  CHARACTER
  LORE
  QUICK_NOTE
}

enum PromptType {
  ROLEPLAY
  BACKSTORY
  RELATIONSHIP
  SCENARIO
}
```

### Database Initialization

```bash
# Initialize Prisma
npx prisma init

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed database (optional)
npx prisma db seed
```

## Backend Implementation

### Main Server Setup

```typescript
// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import campaignRoutes from './routes/campaigns';
import characterRoutes from './routes/characters';
import journalRoutes from './routes/journal';
import aiRoutes from './routes/ai';
import tagRoutes from './routes/tags';

import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing and compression
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/campaigns', authenticateToken, campaignRoutes);
app.use('/api/v1/characters', authenticateToken, characterRoutes);
app.use('/api/v1/journal', authenticateToken, journalRoutes);
app.use('/api/v1/ai', authenticateToken, aiRoutes);
app.use('/api/v1/tags', authenticateToken, tagRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

### Authentication Service

```typescript
// backend/src/services/authService.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthService {
  async register(email: string, username: string, password: string) {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash
      },
      select: {
        id: true,
        email: true,
        username: true,
        subscriptionTier: true,
        createdAt: true
      }
    });

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user.id);

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        subscriptionTier: user.subscriptionTier
      },
      accessToken,
      refreshToken
    };
  }

  private generateTokens(userId: string) {
    const accessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(decoded.userId);
      
      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}
```

### AI Service Implementation

```typescript
// backend/src/services/aiService.ts
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';
import { ContextBuilder } from '../utils/contextBuilder';
import { PromptTemplateEngine } from '../utils/promptTemplateEngine';

const prisma = new PrismaClient();

export class AIService {
  private openai: OpenAI;
  private claude: Anthropic;
  private contextBuilder: ContextBuilder;
  private templateEngine: PromptTemplateEngine;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    this.contextBuilder = new ContextBuilder();
    this.templateEngine = new PromptTemplateEngine();
  }

  async generatePrompt(request: {
    userId: string;
    characterId: string;
    promptType: 'ROLEPLAY' | 'BACKSTORY' | 'SCENARIO';
    specificContext?: any;
    userInput?: string;
    provider?: 'openai' | 'claude';
  }) {
    const {
      userId,
      characterId,
      promptType,
      specificContext,
      userInput,
      provider = 'openai'
    } = request;

    try {
      // Build comprehensive context
      const context = await this.contextBuilder.buildContext(
        userId,
        characterId,
        promptType
      );

      // Generate prompt from template
      const prompt = this.templateEngine.renderTemplate(
        promptType.toLowerCase(),
        { ...context, userInput, ...specificContext }
      );

      // Generate system prompt
      const systemPrompt = this.buildSystemPrompt(context.character, promptType);

      // Call AI provider
      const response = provider === 'openai' 
        ? await this.callOpenAI(systemPrompt, prompt, promptType)
        : await this.callClaude(systemPrompt, prompt, promptType);

      // Process response
      const processedResponse = this.processResponse(response, promptType);

      // Save interaction
      await prisma.aIPrompt.create({
        data: {
          userId,
          characterId,
          promptType,
          inputContext: JSON.stringify(context),
          generatedResponse: JSON.stringify(processedResponse)
        }
      });

      return processedResponse;

    } catch (error) {
      console.error('AI Generation Error:', error);
      throw new Error('Failed to generate AI prompt');
    }
  }

  private async callOpenAI(systemPrompt: string, prompt: string, promptType: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: this.getTemperatureForPromptType(promptType),
      max_tokens: this.getMaxTokensForPromptType(promptType)
    });

    return response.choices[0].message.content || '';
  }

  private async callClaude(systemPrompt: string, prompt: string, promptType: string) {
    const response = await this.claude.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: this.getMaxTokensForPromptType(promptType),
      temperature: this.getTemperatureForPromptType(promptType),
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  private buildSystemPrompt(character: any, promptType: string): string {
    return `You are an expert D&D roleplay assistant helping players develop their characters.

Character: ${character.name} (${character.race} ${character.class}, Level ${character.level})

Your responses should:
1. Stay true to D&D 5e lore and mechanics
2. Be creative but grounded in the established character
3. Provide actionable suggestions for roleplay
4. Consider emotional and psychological aspects
5. Encourage character growth

Tone: Encouraging, insightful, and creative while maintaining consistency.`;
  }

  private getTemperatureForPromptType(promptType: string): number {
    const temperatureMap = {
      'ROLEPLAY': 0.8,
      'BACKSTORY': 0.7,
      'SCENARIO': 0.9
    };
    return temperatureMap[promptType] || 0.7;
  }

  private getMaxTokensForPromptType(promptType: string): number {
    const tokenMap = {
      'ROLEPLAY': 500,
      'BACKSTORY': 800,
      'SCENARIO': 600
    };
    return tokenMap[promptType] || 500;
  }

  private processResponse(response: string, promptType: string) {
    // Parse and structure the response based on type
    // This would include extracting specific sections, formatting, etc.
    return {
      type: promptType,
      content: response,
      metadata: {
        generatedAt: new Date().toISOString(),
        promptType
      }
    };
  }
}
```

## Frontend Implementation

### Main App Layout

```tsx
// frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'D&D Journal - Your Digital Campaign Companion',
  description: 'Track your D&D campaigns, develop your characters, and get AI-powered roleplay inspiration.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### React Query & State Management Setup

```tsx
// frontend/src/app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SessionProvider } from 'next-auth/react';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
```

### Journal Editor Component

```tsx
// frontend/src/components/journal/JournalEditor.tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TagInput } from '@/components/ui/tag-input';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createJournalEntry, updateJournalEntry } from '@/lib/api';

interface JournalEditorProps {
  entry?: JournalEntry;
  campaignId: string;
  characterId?: string;
  onSave?: () => void;
}

export function JournalEditor({ entry, campaignId, characterId, onSave }: JournalEditorProps) {
  const [title, setTitle] = useState(entry?.title || '');
  const [entryType, setEntryType] = useState(entry?.entryType || 'SESSION');
  const [tags, setTags] = useState<string[]>(entry?.tags?.map(t => t.name) || []);
  const [sessionDate, setSessionDate] = useState(
    entry?.sessionDate ? new Date(entry.sessionDate).toISOString().split('T')[0] : 
    new Date().toISOString().split('T')[0]
  );

  const queryClient = useQueryClient();

  const editor = useEditor({
    extensions: [StarterKit],
    content: entry?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (entry?.id) {
        return updateJournalEntry(entry.id, data);
      } else {
        return createJournalEntry(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      onSave?.();
    }
  });

  const handleSave = () => {
    const content = editor?.getHTML() || '';
    
    const entryData = {
      title,
      content,
      entryType,
      campaignId,
      characterId,
      sessionDate: entryType === 'SESSION' ? sessionDate : null,
      tags
    };

    saveMutation.mutate(entryData);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Entry title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        
        <Select value={entryType} onValueChange={setEntryType}>
          <SelectTrigger>
            <SelectValue placeholder="Entry type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SESSION">Session Notes</SelectItem>
            <SelectItem value="CHARACTER">Character Development</SelectItem>
            <SelectItem value="LORE">Campaign Lore</SelectItem>
            <SelectItem value="QUICK_NOTE">Quick Note</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {entryType === 'SESSION' && (
        <Input
          type="date"
          value={sessionDate}
          onChange={(e) => setSessionDate(e.target.value)}
        />
      )}

      <TagInput
        value={tags}
        onChange={setTags}
        placeholder="Add tags..."
      />

      <div className="border rounded-lg">
        <div className="border-b p-2 bg-gray-50">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={editor?.isActive('bold') ? 'bg-gray-200' : ''}
            >
              Bold
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={editor?.isActive('italic') ? 'bg-gray-200' : ''}
            >
              Italic
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor?.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
            >
              H2
            </Button>
          </div>
        </div>
        
        <EditorContent editor={editor} />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving...' : 'Save Entry'}
        </Button>
      </div>
    </div>
  );
}
```

### AI Assistant Component

```tsx
// frontend/src/components/ai/AIAssistant.tsx
'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { generateAIPrompt } from '@/lib/api';
import { Sparkles, MessageCircle, User, Scroll } from 'lucide-react';

interface AIAssistantProps {
  characterId: string;
  recentEntries?: JournalEntry[];
}

export function AIAssistant({ characterId, recentEntries }: AIAssistantProps) {
  const [promptType, setPromptType] = useState<'ROLEPLAY' | 'BACKSTORY' | 'SCENARIO'>('ROLEPLAY');
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState<any>(null);

  const generateMutation = useMutation({
    mutationFn: async (data: any) => generateAIPrompt(data),
    onSuccess: (data) => {
      setResponse(data);
    }
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      characterId,
      promptType,
      userInput: userInput.trim() || undefined,
      specificContext: {
        scenario: userInput
      }
    });
  };

  const promptTypeIcons = {
    ROLEPLAY: MessageCircle,
    BACKSTORY: User,
    SCENARIO: Scroll
  };

  const IconComponent = promptTypeIcons[promptType];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Roleplay Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={promptType} onValueChange={(value: any) => setPromptType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose prompt type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ROLEPLAY">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Roleplay Suggestions
                  </div>
                </SelectItem>
                <SelectItem value="BACKSTORY">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Backstory Development
                  </div>
                </SelectItem>
                <SelectItem value="SCENARIO">
                  <div className="flex items-center gap-2">
                    <Scroll className="h-4 w-4" />
                    Scenario Generation
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Textarea
            placeholder={getPlaceholderText(promptType)}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            rows={3}
          />

          <Button 
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="w-full"
          >
            <IconComponent className="h-4 w-4 mr-2" />
            {generateMutation.isPending ? 'Generating...' : `Generate ${promptType} Suggestions`}
          </Button>
        </CardContent>
      </Card>

      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconComponent className="h-5 w-5 text-blue-500" />
              AI Suggestions
              <Badge variant="secondary" className="ml-auto">
                {response.type}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {renderResponse(response)}
            </div>
            
            {response.followUps && response.followUps.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Follow-up suggestions:</h4>
                <div className="flex flex-wrap gap-2">
                  {response.followUps.map((followUp: string, index: number) => (
                    <Badge key={index} variant="outline" className="cursor-pointer hover:bg-gray-100">
                      {followUp}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getPlaceholderText(promptType: string): string {
  const placeholders = {
    ROLEPLAY: "Describe a situation you'd like roleplay suggestions for...",
    BACKSTORY: "What aspect of your character's backstory would you like to explore?",
    SCENARIO: "What kind of scenario or challenge interests you?"
  };
  return placeholders[promptType] || '';
}

function renderResponse(response: any) {
  if (response.type === 'ROLEPLAY' && response.dialogueOptions) {
    return (
      <div>
        <div className="mb-4" dangerouslySetInnerHTML={{ __html: response.content }} />
        
        {response.dialogueOptions.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Dialogue Options:</h4>
            <ul className="space-y-2">
              {response.dialogueOptions.map((option: string, index: number) => (
                <li key={index} className="p-2 bg-blue-50 rounded border-l-4 border-blue-200">
                  {option}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  
  return <div dangerouslySetInnerHTML={{ __html: response.content }} />;
}
```

## Environment Configuration

### Backend Environment Variables

```bash
# backend/.env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dnd_journal_db"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"

# AI APIs
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Redis
REDIS_URL="redis://localhost:6379"

# File Storage
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="your-s3-bucket-name"
AWS_REGION="us-east-1"

# App Configuration
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### Frontend Environment Variables

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

## Deployment Guide

### Docker Configuration

```dockerfile
# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Docker Compose for Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: dnd_journal_db
      POSTGRES_USER: dnduser
      POSTGRES_PASSWORD: dndpass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://dnduser:dndpass@postgres:5432/dnd_journal_db
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001/api/v1
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

## Testing Strategy

### Backend Tests

```typescript
// backend/tests/auth.test.ts
import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Authentication', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.accessToken).toBeDefined();
    });

    it('should not register user with existing email', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      };

      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      // Second registration with same email
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);
    });
  });
});
```

### Frontend Tests

```tsx
// frontend/src/components/__tests__/JournalEditor.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { JournalEditor } from '../journal/JournalEditor';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQuery = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('JournalEditor', () => {
  it('renders entry form correctly', () => {
    renderWithQuery(
      <JournalEditor campaignId="test-campaign" />
    );

    expect(screen.getByPlaceholderText('Entry title...')).toBeInTheDocument();
    expect(screen.getByText('Entry type')).toBeInTheDocument();
    expect(screen.getByText('Save Entry')).toBeInTheDocument();
  });

  it('updates title when user types', () => {
    renderWithQuery(
      <JournalEditor campaignId="test-campaign" />
    );

    const titleInput = screen.getByPlaceholderText('Entry title...');
    fireEvent.change(titleInput, { target: { value: 'My Session' } });

    expect(titleInput).toHaveValue('My Session');
  });
});
```

This implementation guide provides a comprehensive roadmap for building the D&D Journal App, from initial setup through deployment. Each section includes practical code examples and best practices to ensure a robust, scalable application that fulfills the core requirements of journaling, AI-powered roleplay assistance, and character development support.