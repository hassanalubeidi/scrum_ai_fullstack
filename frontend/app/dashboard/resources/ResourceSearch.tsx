"use client";

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { searchResources, selectSearchStatus, selectResourceError } from './resourceSlice';
import { AppDispatch } from '../../store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, AlertCircle, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ResourceSearch() {
  const dispatch = useDispatch<AppDispatch>();
  const searchStatus = useSelector(selectSearchStatus);
  const error = useSelector(selectResourceError);
  const [query, setQuery] = useState('');
  const [pages, setPages] = useState(3);

  const handleSearch = () => {
    if (query.trim()) {
      dispatch(searchResources({ query: query.trim(), pages }));
    } else {
      alert('Please enter a search query.');
    }
  };

  return (
    <Card className="w-full my-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold flex items-center">
          <Search className="mr-2 h-5 w-5" />
          Resource Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="search-query">Search Query</Label>
            <div className="flex space-x-2">
              <Input
                id="search-query"
                placeholder="Enter your search query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-grow"
              />
              <div className="flex items-center space-x-2">
                <Label htmlFor="pages" className="whitespace-nowrap">Pages:</Label>
                <Input
                  id="pages"
                  type="number"
                  value={pages}
                  min={1}
                  onChange={(e) => setPages(Number(e.target.value))}
                  className="w-20"
                />
              </div>
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={searchStatus === 'loading'}
          >
            {searchStatus === 'loading' ? (
              <>
                <Search className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <BookOpen className="mr-2 h-4 w-4" />
                Search Resources
              </>
            )}
          </Button>
        </form>
        {searchStatus === 'failed' && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
