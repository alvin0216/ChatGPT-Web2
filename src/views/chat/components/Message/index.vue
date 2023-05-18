<script setup lang='ts'>
import { computed, onMounted, reactive, ref, } from 'vue'
import { NDropdown, NButton, NSpace, useLoadingBar, NSpin } from 'naive-ui'
import AvatarComponent from './Avatar.vue'
import TextComponent from './Text.vue'
import { SvgIcon } from '@/components/common'
import { copyText } from '@/utils/format'
import { useIconRender } from '@/hooks/useIconRender'
import { t } from '@/locales'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { genImg, setWallpaper } from '@/api/imageAI'

interface Props {
	dateTime?: string
	text?: string
	inversion?: boolean
	error?: boolean
	loading?: boolean
	wallpaperKeyword?: string
	wallpaperUrl?: string
}

interface Emit {
	(ev: 'regenerate'): void
	(ev: 'delete'): void
	(ev: 'updateChatItem', obj: any): void
}


const props = defineProps<Props>()


const emit = defineEmits<Emit>()

const { isMobile } = useBasicLayout()

const { iconRender } = useIconRender()

const textRef = ref<HTMLElement>()

const asRawText = ref(props.inversion)
const messageRef = ref<HTMLElement>()

const options = computed(() => {
	const common = [
		{
			label: t('chat.copy'),
			key: 'copyText',
			icon: iconRender({ icon: 'ri:file-copy-2-line' }),
		},
		{
			label: t('common.delete'),
			key: 'delete',
			icon: iconRender({ icon: 'ri:delete-bin-line' }),
		},
	]

	if (!props.inversion) {
		common.unshift({
			label: asRawText.value ? t('chat.preview') : t('chat.showRawText'),
			key: 'toggleRenderType',
			icon: iconRender({ icon: asRawText.value ? 'ic:outline-code-off' : 'ic:outline-code' }),
		})
	}

	return common
})

function handleSelect(key: 'copyText' | 'delete' | 'toggleRenderType') {
	switch (key) {
		case 'copyText':
			copyText({ text: props.text ?? '' })
			return
		case 'toggleRenderType':
			asRawText.value = !asRawText.value
			return
		case 'delete':
			emit('delete')
	}
}

function handleRegenerate() {
	messageRef.value?.scrollIntoView()
	emit('regenerate')
}

const wRef = ref<HTMLElement>()
const { wallpaperKeyword, wallpaperUrl } = props
const wState = reactive({
	gLoading: false,
	sLoading: false,
	error: '',
	url: ''
})

const loadingBar = useLoadingBar()
onMounted(() => {
	if (!wallpaperUrl) {
		generate()
	}
})


function setWallpaperState(ImagePath: string) {

	emit('updateChatItem', {
		wallpaperUrl: ImagePath
	})
}

const picUrl = computed(() => {
	const image = wallpaperUrl?.split(/\\/g).pop()
	if (!image) return ''
	return `http://localhost:8081/Images?${image}`;
})


function generate() {
	if (wallpaperKeyword) {
		wState.gLoading = true
		loadingBar.start()
		genImg(wallpaperKeyword).then(res => {
			setWallpaperState(res.data.ImagePath)
			wState.gLoading = false
			loadingBar.finish()
			setTimeout(() => {
				wRef.value?.scrollIntoView()
			}, 200)
		}).catch(e => {
			wState.gLoading = false
			wState.error = 'true'
			loadingBar.error()
		})
	}
}

function onSetWallpaper() {
	wState.sLoading = true
	setWallpaper(wallpaperUrl || '').then((res) => {
		// ...
	}).finally(() => {
		wState.sLoading = false
	})
}

function regenerate() {
	generate()
}


</script>

<template>
	<div ref="messageRef" class="flex w-full mb-6 overflow-hidden" :class="[{ 'flex-row-reverse': inversion }]">
		<div class="flex items-center justify-center flex-shrink-0 h-8 overflow-hidden rounded-full basis-8"
			:class="[inversion ? 'ml-2' : 'mr-2']">
			<AvatarComponent :image="inversion" />
		</div>
		<div class="overflow-hidden text-sm " :class="[inversion ? 'items-end' : 'items-start']">
			<p class="text-xs text-[#b4bbc4]" :class="[inversion ? 'text-right' : 'text-left']">
				{{ dateTime }}
			</p>
			<div v-if="!wallpaperKeyword" class="flex items-end gap-1 mt-2"
				:class="[inversion ? 'flex-row-reverse' : 'flex-row']">
				<TextComponent ref="textRef" :inversion="inversion" :error="error" :text="text" :loading="loading"
					:as-raw-text="asRawText" />
				<div class="flex flex-col">
					<button v-if="!inversion"
						class="mb-2 transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-300"
						@click="handleRegenerate">
						<SvgIcon icon="ri:restart-line" />
					</button>
					<NDropdown :trigger="isMobile ? 'click' : 'hover'" :placement="!inversion ? 'right' : 'left'" :options="options"
						@select="handleSelect">
						<button class="transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-200">
							<SvgIcon icon="ri:more-2-fill" />
						</button>
					</NDropdown>
				</div>
			</div>
			<div v-else class="mt-2">
				<div
					class="text-black text-wrap min-w-[20px] rounded-md px-3 py-2 bg-[#f4f6f8] dark:bg-[#1e1e20] message-reply inline-block">
					Great choice! I am generating the {{ wallpaperKeyword }} wallpaper for you, please wait...
				</div>
				<div>
					<div v-if="!!wState.error"
						class="text-black text-wrap min-w-[20px] rounded-md px-3 py-2 bg-[#f4f6f8] dark:bg-[#1e1e20] message-reply mt-2 inline-block">
						Unable to generate wallpaper, please try again later.
					</div>
					<div ref="wRef"
						class="text-black text-wrap min-w-[20px] rounded-md px-3 py-2 bg-[#f4f6f8] dark:bg-[#1e1e20] message-reply mt-2 inline-block">
						<NSpin size="small" v-if="!wallpaperUrl && wState.gLoading" />
						<div v-if="!!wallpaperUrl">
							<div>
								Here's a wallpaper for you.
							</div>
							<img :src="picUrl" :key="picUrl" alt="" class="max-w-full h-auto py-[14px]">
							Do you like it? click the button below to regenerate the wallpaper or set it as wallpaper directly.
							<NSpace class="mt-[14px]">
								<NButton :loading="wState.gLoading" :disabled="wState.sLoading" @click="regenerate" class="mr-[14px]">
									Regenerate
								</NButton>
								<NButton type="info" :disabled="wState.gLoading" :loading="wState.sLoading" @click="onSetWallpaper">
									Set as Wallpaper
								</NButton>
							</NSpace>
						</div>
					</div>
				</div>
				<!--  -->
			</div>
		</div>
	</div>
</template>
