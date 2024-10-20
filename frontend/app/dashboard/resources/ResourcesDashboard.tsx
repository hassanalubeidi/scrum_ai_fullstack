"use client";

import React from 'react';
import { ResourceUploader } from './ResourceUploader';
import { ResourceSearch } from './ResourceSearch';
import { ResourceList } from './ResourceList';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ResourcesDashboard() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Resource Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>
          <TabsContent value="upload">
            <ResourceUploader />
          </TabsContent>
          <TabsContent value="search">
            <ResourceSearch />
            <ResourceList />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
