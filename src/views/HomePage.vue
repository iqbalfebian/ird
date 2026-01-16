<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Blanks</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <!-- <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Blanks</ion-title>
        </ion-toolbar>
      </ion-header> -->

      <ion-grid>
        <ion-row>
          <ion-col size="6" v-for="photo in photos" :key="photo.filePath">
            <ion-img :src="photo.webviewPath" @click="showActionSheet(photo)"></ion-img>
          </ion-col>
        </ion-row>
      </ion-grid>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button @click="addNewToGallery()">
          <ion-icon :icon="camera"></ion-icon>
        </ion-fab-button>
      </ion-fab>


    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { actionSheetController, IonCol, IonFab, IonFabButton, IonGrid, IonIcon, IonImg, IonRow } from '@ionic/vue';
import { camera, trash } from 'ionicons/icons';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { usePhotoGallery } from '@/composables/use-photo-gallery';
// import { addNewToGallery, photos } from '@/composables/use-photo-gallery';

const { photos, addNewToGallery, deletePhoto } = usePhotoGallery()

const showActionSheet = async (photo: UserPhoto) => {
  const actionSheet = await actionSheetController.create({
    header: 'Photos',
    buttons: [
      {
        text: 'Delete',
        role: 'destructive',
        icon: trash,
        handler: () => {
          deletePhoto(photo);
        },
      },
      {
        text: 'Cancel',
        icon: close,
        role: 'cancel',
        handler: () => {
          // Nothing to do, action sheet is automatically closed
        },
      },
    ],
  });
  await actionSheet.present();
};

</script>
