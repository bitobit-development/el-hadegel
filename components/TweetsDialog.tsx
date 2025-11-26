'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TweetsList } from '@/components/TweetsList';
import { getMKTweets } from '@/app/actions/tweet-actions';
import { TweetData } from '@/types/tweet';

interface TweetsDialogProps {
  mkId: number;
  mkName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TweetsDialog({ mkId, mkName, isOpen, onClose }: TweetsDialogProps) {
  const [tweets, setTweets] = useState<TweetData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTweets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMKTweets(mkId, 50);
      setTweets(data);
    } catch (error) {
      console.error('Error loading tweets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [mkId]);

  useEffect(() => {
    if (isOpen) {
      loadTweets();
    }
  }, [isOpen, loadTweets]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-right">
            הצהרות ופוסטים - {mkName}
          </DialogTitle>
          <DialogDescription className="text-right">
            כל ההצהרות והפוסטים של ח״כ {mkName} בנוגע לחוק הגיוס
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">טוען הצהרות...</p>
              </div>
            </div>
          ) : (
            <TweetsList
              tweets={tweets}
              emptyMessage={`לא נמצאו הצהרות עבור ${mkName}`}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
